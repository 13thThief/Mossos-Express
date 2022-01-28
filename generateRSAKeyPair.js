'use strict';

const crypto = require('crypto');
const fs = require('fs');

const publicKeyPath = __dirname + '/KEY_RSA_PUB.pem';
const privateKeyPath = __dirname + '/KEY_RSA_PRI.pem';

try {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 4096,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem'
    }
  });

  fs.writeFileSync(publicKeyPath, publicKey); 
  fs.writeFileSync(privateKeyPath, privateKey);
} catch(e) {
  console.error('RSA generation failed:', e);
}
