'use strict';

const { nanoid } = require('nanoid');

module.exports = function(length=5){
  return nanoid(length)
}