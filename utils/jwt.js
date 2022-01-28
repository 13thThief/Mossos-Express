'use strict';

const { RSA_PRI_KEY, HS_KEY } = require('./keys');

const ALGORITHM = process.env.JWT_ALGORITHM === 'symmetric' ? 'HS256' : 'RS256';
const KEY = ALGORITHM === 'HS256' ? HS_KEY : RSA_PRI_KEY;

const jwt = require('jsonwebtoken');
const jwt_decode = require('jwt-decode');

const { 
  handleErrors,
  GeneralError,
  BadRequest,
  Unauthorized,
  UnprocessableEntity,
  NotFound,
  InternalServerError
} = require('./errorHandler');

// To encrypt and decrypt JWT token
const { encrypt, decrypt } = require('./crypto_aes');

module.exports = {
  issueJWT,
  verifyJWT,
  decodeJWT
}

function issueJWT(user) {
  const seconds = 20 * 60; // 20 mins * 60 seconds
  const nowInSeconds = Math.floor(Date.now() / 1000);
  const expiresIn = nowInSeconds + seconds;
  const payload = {
    user: user.id,
    iat: nowInSeconds,
    exp: expiresIn,
    role: 'user'
  };

  const signedToken = jwt.sign(payload, KEY, { algorithm: ALGORITHM });
  const encryptedToken = encrypt(signedToken);

  return encryptedToken;
}

function verifyJWT(token) {
  return new Promise((resolve, reject) => {
    jwt.verify(token, KEY, { algorithms: [ALGORITHM] }, (err, payload) => {
        if (!err) {
          return resolve(payload); 
        }
        switch(err.name) {
          case 'TokenExpiredError':
            throw new BadRequest('Token Expired');
          case 'JsonWebTokenError':
            throw new BadRequest('Malformed Token');
        }
    })
  })
}

function decodeJWT(token) {
  return jwt_decode(token);
}