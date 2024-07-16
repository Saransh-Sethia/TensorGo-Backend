const express = require('express');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const session = require('express-session');
const dotenv = require("dotenv");
dotenv.config()

const app = express();
app.use(express.json());
app.use(session({ secret: 'secret', resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());


passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.CALLBACK_URL
  },
  function(accessToken, refreshToken, profile, cb) {

    return cb(null, { profile: profile, accessToken: accessToken });
  }
));


passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});



app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), (req, res) => {
  res.redirect(process.env.FRONTEND_URL);  
});


app.get('/api/invoices', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).send('You need to log in');
  }
  
  res.json([{ id: 1, amount: 1000, dueDate: '2024-07-31', recipient: 'Customer A' }]);
});

async function sendInvoiceToZapier(invoice) {
    const zapierWebhookURL = process.env.ZAPIER_WEBHOOK_URL;
    try {
      const response = await axios.post(zapierWebhookURL, invoice);
      console.log(`Zapier response: ${response.status}`);
    } catch (error) {
      console.error(`Error sending data to Zapier: ${error}`);
    }
  }
  
  app.get('/api/check-invoices', async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send('You need to log in');
    }
  
    
    const invoices = [
      { id: 1, amount: 1000, dueDate: '2024-07-31', recipient: 'Customer A' },
      { id: 2, amount: 1500, dueDate: '2024-06-30', recipient: 'Customer B' },
    ];
  
    const now = new Date();
  
    for (const invoice of invoices) {
      const dueDate = new Date(invoice.dueDate);
      
      if (dueDate < now) {
        await sendInvoiceToZapier(invoice);
      }
    }
  
    res.send('Checked invoices for past due.');
  });
  

  app.get("/", (req, res) => {
    res.send("Backend server is running");
  });

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));