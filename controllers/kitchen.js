'use strict';

const prisma = require('../db');
const {
  InternalServerError,
  shuffleArray
} = require('../utils');
const _ = require('lodash');

async function getKitchens(req, res) {

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
      veg: true,
      image: true,
    },
  };

  if(veg !== 'all') {
     filter.where.veg = veg;
  }

  let kitchens;

  try {
    kitchens = await prisma.kitchens.findMany(filter);
  } catch(e) {
    throw new InternalServerError('Failed to get kitchens');
  }

  let randomKitchens = shuffleArray(kitchens);
  res.set('Cache-Control', 'public, max-age=120, must-revalidate');
  res.json(randomKitchens);
}

async function getSpecificKitchen(req, res) {
  const { kitchenId } = req.params;

  const filter = {
    where: {
      id: kitchenId
    },
    select: {
      id: true,
      name: true,
      description: true,
      veg: true,
      image: true,
    }
  }

  let kitchen;

  try {
    kitchen = await prisma.kitchens.findUnique(filter);
  } catch(e) {
    console.error(e)
    throw new InternalServerError(`Failed to get the kitchen`);
  }

  res.set('Cache-Control', 'public, max-age=120, must-revalidate');
  res.json(kitchen)
}

module.exports = {
  getKitchens,
  getSpecificKitchen
}