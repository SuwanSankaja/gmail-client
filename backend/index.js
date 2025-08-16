// backend/index.js

const express = require('express');
require('dotenv').config();
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
// Import models and Sequelize Op separately (Op was not exported from ./models and caused undefined errors)
const { sequelize, User, EmailMetadata } = require('./models');
const { Op } = require('sequelize');
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


// --- NEW: API Route to Sync Emails from Gmail to DB ---
app.get('/api/sync-emails', ensureAuthenticated, async (req, res) => {
  try {
    const user = req.user;
    console.log('Starting email sync for user:', user.email);
    const xoauth2Token = Buffer.from(`user=${user.email}\x01auth=Bearer ${user.accessToken}\x01\x01`).toString('base64');
    const config = {
      imap: { user: user.email, xoauth2: xoauth2Token, host: 'imap.gmail.com', port: 993, tls: true, authTimeout: 15000, tlsOptions: { rejectUnauthorized: false } }
    };
    const connection = await imaps.connect(config);
    await connection.openBox('INBOX');
    const searchCriteria = ['ALL'];
    const fetchOptions = { bodies: ['HEADER.FIELDS (FROM SUBJECT DATE MESSAGE-ID)'], markSeen: false };
    const messages = await connection.search(searchCriteria, fetchOptions);
    
    const emailsForDb = messages.map(item => {
      const header = item.parts.find(part => part.which.includes('HEADER.FIELDS')).body;
      const messageId = header['message-id'] ? header['message-id'][0].replace(/[<>]/g, '') : null;
      return {
        messageId: messageId,
        from: header.from ? header.from[0] : 'N/A',
        subject: header.subject ? header.subject[0] : 'No Subject',
        date: header.date ? new Date(header.date[0]) : new Date(),
        userId: user.id
      };
    }).filter(email => email.messageId);

    if (emailsForDb.length > 0) {
      const result = await EmailMetadata.bulkCreate(emailsForDb, { ignoreDuplicates: true });
      console.log(`Sync complete. Saved ${result.length} new email metadata records.`);
    } else {
      console.log('Sync complete. No new emails found.');
    }
    connection.end();
    res.status(200).send('Email sync completed successfully.');
  } catch (error) {
    console.error('Error syncing emails:', error);
    res.status(500).send('Failed to sync emails.');
  }
});


// --- UPDATED: API Route to Fetch Emails from DB with Pagination and Search ---
app.get('/api/emails', ensureAuthenticated, async (req, res) => {
  try {
    const { page = 1, search = '' } = req.query;
    const limit = 10; // Emails per page
    const offset = (page - 1) * limit;

    const whereClause = {
      userId: req.user.id,
    };

    if (search) {
      whereClause[Op.or] = [
        { from: { [Op.like]: `%${search}%` } },
        { subject: { [Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows } = await EmailMetadata.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [['date', 'DESC']], // Show newest emails first
    });

    res.json({
      emails: rows,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
    });

  } catch (error) {
    console.error('Error fetching emails from DB:', error);
    res.status(500).send('Failed to fetch emails from database.');
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
