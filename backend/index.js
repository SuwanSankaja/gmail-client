// backend/index.js

const express = require('express');
require('dotenv').config();
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { sequelize, User } = require('./models'); // Import User model

const app = express();
const PORT = process.env.PORT || 5000;

// 1. Configure Express Session
app.use(session({
  secret: process.env.SESSION_SECRET, // A secret key for signing the session ID cookie
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // For development, set to false. For production, true with https.
}));

// 2. Initialize Passport and session middleware
app.use(passport.initialize());
app.use(passport.session());

// 3. Configure Passport Google OAuth2 Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback"
  },
  async (accessToken, refreshToken, profile, done) => {
    // This function is called when a user successfully authenticates with Google.
    try {
      // Find if a user with this Google ID already exists
      let user = await User.findOne({ where: { googleId: profile.id } });

      if (user) {
        // If user exists, update their tokens and save
        user.accessToken = accessToken;
        user.refreshToken = refreshToken;
        await user.save();
        return done(null, user);
      } else {
        // If user does not exist, create a new user in the database
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

// 4. Serialize and Deserialize User
// Determines which data of the user object should be stored in the session.
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Retrieves the user data from the session.
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findByPk(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});


// 5. Define Authentication Routes
// This route starts the authentication process.
// When a user visits this URL, they are redirected to Google's login page.
app.get('/auth/google',
  passport.authenticate('google', { 
    scope: [
      'profile', 
      'email',
      'https://www.googleapis.com/auth/gmail.readonly' // Scope to read emails
    ],
    accessType: 'offline', // Important to get a refresh token
    prompt: 'consent'
  })
);

// This is the callback route Google redirects to after the user grants permission.
app.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login-failed' }),
  (req, res) => {
    // Successful authentication, redirect to the frontend dashboard.
    // We will build the frontend later. For now, let's redirect to a success page.
    res.redirect('/profile');
  }
);

// A simple route to check if the user is logged in
app.get('/profile', (req, res) => {
  if (req.isAuthenticated()) {
    res.send(`Hello, ${req.user.email}. You are logged in!`);
  } else {
    res.redirect('/');
  }
});


app.get('/', (req, res) => {
  res.send('Hello from the Gmail API Backend! <a href="/auth/google">Login with Google</a>');
});


// Start the server
app.listen(PORT, async () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
});
