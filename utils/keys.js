'use strict';

const fs = require('fs');
const path = require('path');

const RSA_PUB_KEY = fs.readFileSync(path.join(__dirname, '..', 'KEY_RSA_PUB.pem'), 'utf8');
const RSA_PRI_KEY = fs.readFileSync(path.join(__dirname, '..', 'KEY_RSA_PRI.pem'), 'utf8');

const HS_KEY = fs.readFileSync(path.join(__dirname, '..', 'KEY_HMAC'), 'utf8');

const AES_KEY = fs.readFileSync(path.join(__dirname, '..', 'KEY_AES'), 'utf8');

module.exports = {
  RSA_PUB_KEY,
  RSA_PRI_KEY,
  HS_KEY,
  AES_KEY
}