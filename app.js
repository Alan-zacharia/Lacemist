var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const session = require('express-session');
const mongooose = require('mongoose');
const bodyParser = require('body-parser');
const dotenv = require('dotenv').config()
var adminRouter = require('./routes/admin');
var usersRouter = require('./routes/customer');
const { default: mongoose } = require('mongoose');
const MongoURL  = process.env.MONGO_DB_URL;

mongoose.connect(MongoURL,{
  useNewUrlParser: true,
  tlsAllowInvalidHostnames:true,
  tlsAllowInvalidCertificates:true,
})


var app = express();

const db = mongooose.connection;
db.on('error',()=>{
  console.log("Error while connecting");
})
db.once('open',()=>{
  console.log("Connected Succecfully");
})

app.use(session({
  name:"Session", 
  secret:"your-secret-key",
  resave:false,
  saveUninitialized :false,
  cookie :{maxAge : 3600000}
}));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use((req,res,next)=>{
res.header('Cache-Control',"private,no-store,no-cache,must-revalidate")
next();
})
app.use('/', usersRouter);
app.use('/admin', adminRouter);

app.get('*',(req,res,next)=>{
  res.render("Page-not-found")
})

app.use(function(req, res, next) {
  next(createError(404));
});


app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('page-not-found');
});

module.exports = app;
