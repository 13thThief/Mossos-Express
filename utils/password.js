'use strict';

const bcrypt = require ('bcrypt');
const SALT_ROUNDS = 13;

async function hashPassword(password){
  try {
    return await bcrypt.hash(password, SALT_ROUNDS);
  } catch(e) {
    throw new Error('Password encryption failed')
  }
}

async function comparePasswords(password, hash){
  try {
    return await bcrypt.compare(password, hash);
  } catch(e) {
    throw new Error('Password comparison failed')
  }
}

module.exports = {
  hashPassword,
  comparePasswords
}