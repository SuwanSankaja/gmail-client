// backend/index.js

const express = require('express');
require('dotenv').config();
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { sequelize, User } = require('./models');
const imaps = require('imap-simple'); // Import the imap-simple library

const app = express();
const PORT = process.env.PORT || 5000;

// --- Session and Passport Configuration (No Changes Here) ---
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
        user.refreshToken = refreshToken; // Important for long-term access
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
    } catch (err)
{
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

// --- Middleware to check if the user is authenticated ---
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).send('You are not authenticated');
}


// --- Authentication Routes (Scope Updated) ---
app.get('/auth/google',
  passport.authenticate('google', { 
    scope: [
      'profile', 
      'email',
      // --- FIX: Use a broader scope that is guaranteed to work with IMAP ---
      'https://mail.google.com/' 
    ],
    accessType: 'offline',
    prompt: 'consent'
  })
);

app.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login-failed' }),
  (req, res) => {
    res.redirect('/profile');
  }
);

// --- Profile and Root Routes (No Changes Here) ---
app.get('/profile', ensureAuthenticated, (req, res) => {
  res.send(`
    <h1>Hello, ${req.user.email}</h1>
    <p>You are logged in!</p>
    <a href="/api/emails">Fetch My Emails</a>
    `);
});

app.get('/', (req, res) => {
  res.send('Hello from the Gmail API Backend! <a href="/auth/google">Login with Google</a>');
});


// --- API Route to Fetch Emails ---
app.get('/api/emails', ensureAuthenticated, async (req, res) => {
  try {
    const user = req.user;

    const xoauth2Token = Buffer.from(
      `user=${user.email}\x01auth=Bearer ${user.accessToken}\x01\x01`
    ).toString('base64');

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
    console.log("IMAP connection successful!");

    await connection.openBox('INBOX');
    
    const searchCriteria = ['ALL'];
    const fetchOptions = {
      bodies: ['HEADER.FIELDS (FROM SUBJECT DATE)'],
      markSeen: false,
    };
    
    const messages = await connection.search(searchCriteria, fetchOptions);

    const emails = messages.map(item => {
      const header = item.parts.find(part => part.which === 'HEADER.FIELDS (FROM SUBJECT DATE)').body;
      return {
        from: header.from ? header.from[0] : 'N/A',
        subject: header.subject ? header.subject[0] : 'No Subject',
        date: header.date ? header.date[0] : 'No Date'
      };
    }).slice(-10).reverse();

    connection.end();

    res.json(emails);

  } catch (error) {
    console.error('Error fetching emails:', error);
    res.status(500).send('Failed to fetch emails.');
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
