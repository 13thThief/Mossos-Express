'use strict';

const crypto = require('crypto');
const { AES_KEY } = require('./keys');
const CryptoJS = require('crypto-js');

module.exports = {
  encrypt,
  decrypt
}

// // actual key in wordarray, not derived
// const keyWord = CryptoJS.enc.Base64.parse(KEY_AES);

function encrypt(data){
  const iv = crypto.randomBytes(2).toString('base64'); // 2 bytes * 8 = 16 bits
  // const ivWord = CryptoJS.enc.Base64.parse(iv);
  data = iv + ':' + data;
  const encryptedBytes = CryptoJS.AES.encrypt(data, AES_KEY);
  const encryptedString = encryptedBytes.toString();
  return encryptedString;
}

function decrypt(data){
  const decryptedBytes = CryptoJS.AES.decrypt(data, AES_KEY);
  const decryptedString = CryptoJS.enc.Utf8.stringify(decryptedBytes);
  return decryptedString.split(':')[1];
}

