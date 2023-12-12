var http = require('http');
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const session = require('express-session');
const mongooose = require('mongoose');
const bodyParser = require('body-parser');
var debug = require('debug')('my-express-app:server');
const dotenv = require('dotenv').config()
var adminRouter = require('./routes/admin');
var usersRouter = require('./routes/customer');
const {
mongoose
} = require('mongoose');
const MongoURL = process.env.MONGO_DB_URL;
var app = express();



var port = normalizePort(process.env.PORT || '3000');
app.set('port', port);
var server = http.createServer(app);
server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    return val;
  }

  if (port >= 0) {
    return port;
  }

  return false;
}

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string' ?
    'Pipe ' + port :
    'Port ' + port;

  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string' ?
    'pipe ' + addr :
    'port ' + addr.port;
  debug('Listening on ' + bind);
}


mongoose.connect(MongoURL, {
  tlsAllowInvalidHostnames: true,
  tlsAllowInvalidCertificates: true,
  ssl:true,
})
const db = mongooose.connection;
db.on('error', () => {
  console.log("Error while connecting");
})
db.once('open', () => {
  console.log("Connected Succecfully");
})

app.use(session({
  name: "Session",
  secret: "your-secret-key",
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 3600000
  }
}));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({
  extended: true
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
  res.header('Cache-Control', "private,no-store,no-cache,must-revalidate")
  next();
})
app.use('/', usersRouter);
app.use('/admin', adminRouter);

app.get('*', (req, res, next) => {
  res.render("Page-not-found")
})

app.use(function (req, res, next) {
  next(createError(404));
});


app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('page-not-found');
});

module.exports = app;