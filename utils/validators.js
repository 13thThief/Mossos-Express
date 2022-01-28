'use strict';

const Validator = require("fastest-validator");
const v = new Validator();

const placeOrderSchema = {
  date: "date|convert:true",
  items: { type: "array", max: 10, empty: false,
      items: {
        type: "object", props: {
            menu: "string|empty:false",
            quantity: "number|min:1|max:10|positive:true|integer:true",
        }
    }
  }
}

const checkPlaceOrderType = v.compile(placeOrderSchema);

module.exports = {
  checkPlaceOrderType
}