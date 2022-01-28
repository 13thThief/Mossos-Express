'use strict';

const fs = require('fs');
const crypto = require('crypto');
// const CryptoJS = require('crypto-js');

const keyPath = __dirname + '/KEY_HMAC';

// HMAC - HS256 for JWT integrity

try {
  if(!fs.existsSync(keyPath)){
    const keyBytes = crypto.randomBytes(16); // 16 bytes * 8 = 128 bits for HS256
    const textSecret = keyBytes.toString('base64');
    fs.writeFileSync(keyPath, textSecret);
  }
} catch(e) {
  console.error('HMAC generation failed:', e);
}


