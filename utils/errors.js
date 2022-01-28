'use strict';

class GeneralError extends Error {
  constructor(message) {
    super();
    this.message = message;
  }

  getCode() {
    if (this instanceof BadRequest) {
      return 400;
    } if (this instanceof Unauthorized) {
      return 401;
    } if (this instanceof UnprocessableEntity) {
      return 422;
    } if (this instanceof NotFound) {
      return 404;
    } if (this instanceof InternalServerError) {
      return 500;
    }
    return 500;
  }
}

class BadRequest extends GeneralError { }
class Unauthorized extends GeneralError { }
class UnprocessableEntity extends GeneralError { }
class NotFound extends GeneralError { }
class InternalServerError extends GeneralError { }

module.exports = {
  GeneralError,
  BadRequest,
  Unauthorized,
  UnprocessableEntity,
  NotFound,
  InternalServerError
};