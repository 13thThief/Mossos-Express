'use strict';

const {
  GeneralError,
  BadRequest,
  Unauthorized,
  UnprocessableEntity,
  NotFound,
  InternalServerError
 } = require('./errors');

const handleErrors = (err, req, res, next) => {
  if (err instanceof GeneralError) {
    return res.status(err.getCode()).json({
      // status: 'error',
      // name: '',
      message: err.message
    });
  }

  return res.status(`${err.status || 500}`).json({
    // status: 'error',
    // name: ''
    message: err.message
  });
}


module.exports = {
  handleErrors,
  GeneralError,
  BadRequest,
  Unauthorized,
  UnprocessableEntity,
  NotFound,
  InternalServerError
}
