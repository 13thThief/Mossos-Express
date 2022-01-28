'use strict';

const prisma = require('../db');
const {
  InternalServerError,
  shuffleArray
} = require('../utils');
const _ = require('lodash');

async function getDishes(req, res) {

  let { s, t, v } = req.query;
  s = +s;
  t = +t;
  v = +v;

  let skip = _.isNaN(s) ? 0 : s;
  let take = _.isNaN(t) ? 10 : ((t === 0) ? 10 : 10);
  let veg = _.isNaN(v) ? 'all' : Boolean(v);

  if(skip > 50) skip = 0;

  const filter = {
    skip: skip,
    take: take,
    where: {
      active: true
    },
    select: {
      id: true,
      name: true,
      image: true,
    },
  };

   if(veg !== 'all') {
     filter.where.veg = veg;
  }

  let dishes;

  try {
    dishes = await prisma.dishes.findMany(filter);
  } catch(e) {
    throw new InternalServerError('Failed to get dishes');
  }

  let randomDishes = shuffleArray(dishes);
  return res.json(randomDishes);
}

async function getSpecificDish(req, res) {
  const { dishId } = req.params;

  const filter = {
    where: {
      id: dishId,
      active: true
    },
    select: {
      id: true,
      name: true,
      veg: true,
      image: true,
    }
  }

  let dish;
 
  try {
    dish = await prisma.dishes.findUnique(filter);
  } catch(e) {
    throw new InternalServerError(`Failed to get the dish`);
  }

  return res.json(dish)
}

module.exports = {
  getDishes,
  getSpecificDish
}
