'use strict';

const rateLimiter = require("express-rate-limit");
const ms = require('ms');

function rateLimit(interval='1m', requests=100, message){
  if(!message)
    message = { message: 'Too many requests' }
  return rateLimiter({
    windowMs: ms(interval),
    max: requests, // requests per IP per interval
    message: message,
    headers: false,
    keyGenerator: function (req) {
      return req.headers['realip'] + '-' + req.headers['user-agent'];
    }
  })
}

module.exports = {
  rateLimit
}