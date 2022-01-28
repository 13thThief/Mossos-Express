'use strict';

const isValidEmail = require("email-validator").validate;
const EmailValidation = require('emailvalid');
const ev = new EmailValidation({ allowFreemail: true });
const isDisposableEmail = !ev.check;

module.exports = {
  isValidEmail,
  isDisposableEmail
}