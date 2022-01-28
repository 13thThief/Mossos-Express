'use strict';

const fs = require('fs');
const crypto = require('crypto');
// const CryptoJS = require('crypto-js');

const keyPath = __dirname + '/KEY_AES';

// AES 128 - Symmetric encryption of signed JWT

try {
  if(!fs.existsSync(keyPath)){
    // const key = generateKeySync('aes', 128); // bits
    // console.log(key.export().toString('base64'));
    const keyBytes = crypto.randomBytes(32); // 32 bytes * 8 = 256 bits
    const textSecret = keyBytes.toString('base64');
    fs.writeFileSync(keyPath, textSecret);
  }
} catch(e) {
  console.error('AES generated failed:', e);
}

