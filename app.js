const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const csrf = require('csurf');
const flash = require('connect-flash');
const multer = require('multer');


const errorController = require('./controllers/error');
const User = require('./models/user');
const MONGODB_URI = 'mongodb://127.0.0.1:27017/shop';
const app = express();

const store = new MongoDBStore({
  uri: MONGODB_URI,
  collection: 'sessions'
});
const csrfProtection = csrf();


const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'images');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + file.originalname);
  }
})
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpe' || file.mimetype === 'image/jpeg') {
    cb(null, true);
  } else {
    cb(null, false);
  }
}
app.set('view engine', 'ejs');
app.set('views', 'views');


const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authLogin = require('./routes/auth');
const { connect } = require('./routes/admin');

app.use(bodyParser.urlencoded({
  extended: false
}));

app.use(multer({
  storage: fileStorage,
  fileFilter: fileFilter

}).single('image'));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use(session({
  secret: 'my secret',
  resave: false,
  saveUninitialized: false,
  store: store


}));

app.use(csrfProtection);
app.use(flash());
app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.csrf = req.csrfToken();
  next();
})

app.use((req, res, next) => {
  if (!req.session.user) {
    return next();
  }
  User.findById(req.session.user._id)
    .then(user => {
      if (!user) {
        return next();
      }
      req.user = user;
      next();
    })
    .catch(err => {
      next(new Error(err));
    })
})


app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authLogin);

app.use((error, req, res, next) => {
  res.status(500).render('500', {
    pageTitle: 'Service Unavailable',
    path: '/500',
    isAuthenticated: req.session.isLoggedIn
  })
})
// app.get('/500', errorController.get500);
app.use(errorController.get404);



mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false
  })
  .then(result => {
    app.listen(3000);
    console.log('connected');
  })
  .catch(err => {
    console.log(err);
  });