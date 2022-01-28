'use strict';

require('dotenv').config();
const express = require('express');
require('express-async-errors');
const passport = require('passport');
const helmet = require("helmet");
const cors = require('cors');

const strategy = require('./config/passport');
const routes = require('./routes');

const { handleErrors } = require('./utils')

const app = express();

app.use(express.json({
  limit: '50kb'
}));
app.use(express.urlencoded({ extended: true }));

app.use(helmet());
app.use(cors({
  origin: '*',
  maxAge: 300
}));

// Use in NGINX instead
// const compression = require('compression');
// app.use(compression());
if (app.get('env') === 'production') {
  app.set('trust proxy', 1)
}

passport.use(strategy);
app.use(passport.initialize());

app.get('/', (req, res) => {
  res.sendStatus(200);
});

app.get('/favicon.ico', function (req, res) {
  res.sendStatus(418);
});

app.use('/universe', routes);

// 404
app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// Error Handler
if (app.get('env') === 'development') {
  app.use((err, req, res, next) => {
    if (err.status !== 404 && err.status !== 401)
      console.log(err);
    next(err)
  }, handleErrors)
} else {
  app.use(handleErrors);
}

app.listen(4000, () => {
  console.log('Server running...')
});
