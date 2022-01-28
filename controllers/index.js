'use strict';

const user = require('./user');
const kitchen = require('./kitchen');
const account = require('./account');
const menu = require('./menu');
const order = require('./order');

module.exports = {
  user,
  kitchen,
  menu,
  account,
  order
}