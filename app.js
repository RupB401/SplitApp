var dotenv = require('dotenv')
const path = require('path');
dotenv.config()

var express = require('express')
var logger = require('./helper/logger')
var requestLogger = require('./helper/requestLogger')
var apiAuth = require('./helper/apiAuthentication')
var cors = require('cors')
var passport = require('passport')
var GoogleStrategy = require('passport-google-oauth20').Strategy
var session = require('express-session')
const MongoStore = require('connect-mongo')
var model = require('./model/schema')

var usersRouter = require('./routes/userRouter')
var gorupRouter = require('./routes/groupRouter')
var expenseRouter = require('./routes/expenseRouter')

var app = express()
app.use(cors())
app.use(express.json())

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ 
    mongoUrl: process.env.MONGODB_URI
  }),
  cookie: { 
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production'
  }
}))

// Passport initialization
app.use(passport.initialize())
app.use(passport.session())

// Passport Google Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: '/api/users/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await model.User.findOne({ googleId: profile.id })
    if (!user) {
      // Check if user exists with same email
      user = await model.User.findOne({ emailId: profile.emails[0].value })
      if (user) {
        // Link Google account to existing user
        user.googleId = profile.id
        user.isGoogleUser = true
        user.profilePicture = profile.photos[0]?.value
        await user.save()
      } else {
        // Create new user
        user = new model.User({
          googleId: profile.id,
          name: profile.displayName,
          firstName: profile.name.givenName,
          lastName: profile.name.familyName,
          emailId: profile.emails[0].value,
          profilePicture: profile.photos[0]?.value,
          isGoogleUser: true
        })
        await user.save()
      }
    }
    return done(null, user)
  } catch (error) {
    logger.error(`Google OAuth error: ${error.message}`)
    return done(error, null)
  }
}))

// Serialize/deserialize user
passport.serializeUser((user, done) => done(null, user._id))
passport.deserializeUser(async (id, done) => {
  try {
    const user = await model.User.findById(id)
    done(null, user)
  } catch (error) {
    done(error, null)
  }
})

app.use(requestLogger)

app.use('/api/users', usersRouter)
app.use('/api/group', apiAuth.validateToken,gorupRouter)
app.use('/api/expense', apiAuth.validateToken,expenseRouter)

if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging') {
    app.use(express.static('client/build'));
    app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname,'client','build','index.html'));
    });
   }

//To detect and log invalid api hits 
app.all('*', (req, res) => {
    logger.error(`[Invalid Route] ${req.originalUrl}`)
    res.status(404).json({
        status: 'fail',
        message: 'Invalid path'
      })
})

const port = process.env.PORT || 3001
app.listen(port, (err) => {
    console.log(`Server started in PORT | ${port}`)
    logger.info(`Server started in PORT | ${port}`)
})
