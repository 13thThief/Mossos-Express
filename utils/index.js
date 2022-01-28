'use strict';

const _ = require('lodash');

const ALPHA_NUMERIC = 'Qa1b2c3d4e5Rf6g7h8i9jS0kAlBmZCnDoTEpFqGrHsUItJuKVvLwMWxNXyOYzP';
const NUMERIC = '5023479186';

const { nanoid, customAlphabet } = require('nanoid');
const customNanoid = customAlphabet(ALPHA_NUMERIC);

const _asyncNanoid = require('nanoid/async');
const asyncNanoid = _asyncNanoid.nanoid;
const asyncCustomAlphabet = _asyncNanoid.customAlphabet;
const asyncCustomNanoid = asyncCustomAlphabet(ALPHA_NUMERIC);

// Email, phone & SMS
const isValidPhone = phone => /\d{10}/.test(phone);
const isValidEmail = require("email-validator").validate;

const EmailValidation = require('emailvalid');
const ev = new EmailValidation({ allowFreemail: true });
const isDisposableEmail = (email) => !ev.check(email).valid;

const plusEmailRegex = /^[^+@]+@\S+$/i;
const isPlusEmail = (email) => !plusEmailRegex.test(email);

const createEmailOTP = customAlphabet(NUMERIC, 6);
const createSMSOTP = customAlphabet(NUMERIC, 6);

// Ids
const createId = (length=12) => customNanoid(length);
const asyncCreateId = async (length=12) => (await asyncCustomAlphabet(ALPHA_NUMERIC, length)());
const asyncCreateNumber = async (length=4) => (await asyncCustomAlphabet(NUMERIC, length)());

const isValidId = (id) => id.length > 11;

const shuffleArray = require('array-shuffle');
const validator = require('./validators');

function toCamelCase (obj) {
    let rtn = obj
    if (typeof (obj) === 'object' && obj !== null && !_.isDate(obj)) {
        if (obj instanceof Array) {
            rtn = obj.map(toCamelCase)
        } else {
            rtn = {}
            for (let key in obj) {
                if (obj.hasOwnProperty(key)) {
                     const newKey = key.replace(/(_\w)/g, k => k[1].toUpperCase())
                     rtn[newKey] = toCamelCase(obj[key])
                }
            }
        }
    }
    return rtn
}

module.exports = {
  // Email, phone & sms
  isValidPhone,
  isValidEmail,
  isDisposableEmail,
  isPlusEmail,
  createEmailOTP,
  createSMSOTP,
  // Id
  createId,
  asyncCreateId,
  nanoid,
  customNanoid,
  asyncNanoid,
  asyncCustomNanoid,
  isValidId,
  asyncCreateNumber,
  shuffleArray,
  validator,
  // logger,
  ...require('./rateLimit'),
  ...require('./crypto_aes'),
  ...require('./hash'),
  ...require('./jwt'),
  ...require('./password'),
  ...require('./errorHandler'),
  toCamelCase
};
