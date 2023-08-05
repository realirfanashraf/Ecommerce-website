// Importing required modules
const express = require('express');
const exp = require('constants');
const nocache = require('nocache');
const path = require('path');
const dotenv = require('dotenv');
const session = require('express-session');
const bcrypt = require('bcrypt');
const multer = require('multer')
const twilio = require('./server/routers/twilio-sms')
const paypal = require('paypal-rest-sdk')


// Importing local modules
const connectDB = require('./server/connection/connection');

// Creating the Express app
const app = express();

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;

app.use(nocache())

// Loading environment variables from .env file
dotenv.config({ path: '.env' });

// Setting up session middleware
app.use(session({
  secret: 'secret',
  resave: false,
  saveUninitialized: true,
  cookie: { sameSite: 'strict' }
}));

paypal.configure({
  'mode':'sandbox',
  'client_id':PAYPAL_CLIENT_ID,
  'client_secret':PAYPAL_CLIENT_SECRET
})

// Parsing request bodies //express
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use(express.static("uploads"));



// Setting up the server port 
const PORT = process.env.PORT || 3000;

// Connecting to the database
connectDB();



app.use('/twilio-sms',twilio)
// Setting the view engine to EJS
app.set('view engine', 'ejs');


// Serving static files from the "public" directory
app.use(express.static(path.resolve(__dirname, 'public')));



// Routes
app.use('/admin', require('./server/routers/admin_router'));
app.use('/', require('./server/routers/user_router'));
app.use('/', require('./server/routers/twilio-sms'))
// Starting the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

