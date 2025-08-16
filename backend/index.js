// backend/index.js

const express = require('express');
require('dotenv').config();
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
// Import both User and EmailMetadata models
const { sequelize, User, EmailMetadata } = require('./models');
const imaps = require('imap-simple');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));


// --- Session and Passport Configuration ---
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));
app.use(passport.initialize());
app.use(passport.session());

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback"
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ where: { googleId: profile.id } });
      if (user) {
        user.accessToken = accessToken;
        user.refreshToken = refreshToken;
        await user.save();
        return done(null, user);
      } else {
        user = await User.create({
          googleId: profile.id,
          email: profile.emails[0].value,
          accessToken: accessToken,
          refreshToken: refreshToken
        });
        return done(null, user);
      }
    } catch (err) {
      return done(err, null);
    }
  }
));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findByPk(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).send('You are not authenticated');
}


// --- Authentication Routes ---
app.get('/auth/google',
  passport.authenticate('google', { 
    scope: ['profile', 'email', 'https://mail.google.com/'],
    accessType: 'offline',
    prompt: 'consent'
  })
);

app.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: 'http://localhost:3000/' }),
  (req, res) => {
    res.redirect('http://localhost:3000/');
  }
);

// --- API Route to get the current user ---
app.get('/api/user', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ id: req.user.id, email: req.user.email });
  } else {
    res.status(401).json({ message: 'Not authenticated' });
  }
});


// --- API Route to Fetch and Store Emails ---
app.get('/api/emails', ensureAuthenticated, async (req, res) => {
  try {
    const user = req.user;
    const xoauth2Token = Buffer.from(`user=${user.email}\x01auth=Bearer ${user.accessToken}\x01\x01`).toString('base64');
    const config = {
      imap: {
        user: user.email,
        xoauth2: xoauth2Token,
        host: 'imap.gmail.com',
        port: 993,
        tls: true,
        authTimeout: 5000,
        tlsOptions: { rejectUnauthorized: false }
      }
    };
    const connection = await imaps.connect(config);
    await connection.openBox('INBOX');
    const searchCriteria = ['ALL'];
    // Update fetchOptions to include the message-id, which is a unique identifier for each email
    const fetchOptions = { bodies: ['HEADER.FIELDS (FROM SUBJECT DATE MESSAGE-ID)'], markSeen: false };
    const messages = await connection.search(searchCriteria, fetchOptions);
    
    const emailsForDb = messages.map(item => {
      const header = item.parts.find(part => part.which.includes('HEADER.FIELDS')).body;
      // Clean up the message-id to remove angle brackets
      const messageId = header['message-id'] ? header['message-id'][0].replace(/[<>]/g, '') : null;
      
      return {
        messageId: messageId,
        from: header.from ? header.from[0] : 'N/A',
        subject: header.subject ? header.subject[0] : 'No Subject',
        date: header.date ? new Date(header.date[0]) : new Date(),
        userId: user.id // Associate the email with the current user
      };
    }).filter(email => email.messageId); // Filter out any emails that didn't have a message-id

    // Use bulkCreate to efficiently insert all emails into the database.
    // The 'ignoreDuplicates' option prevents errors if we try to insert an email that already exists.
    if (emailsForDb.length > 0) {
      await EmailMetadata.bulkCreate(emailsForDb, { ignoreDuplicates: true });
      console.log(`Saved ${emailsForDb.length} email metadata records to the database.`);
    }

    connection.end();

    // Send the most recent 10 emails to the frontend
    res.json(emailsForDb.slice(-10).reverse());

  } catch (error) {
    console.error('Error fetching or saving emails:', error);
    res.status(500).send('Failed to fetch or save emails.');
  }
});


// --- Start the server ---
app.listen(PORT, async () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
});
