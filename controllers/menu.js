'use strict';

const prisma = require('../db');
const passport = require('passport');
const {
  isValidId,
  asyncCreateId,
  BadRequest,
  UnprocessableEntity,
  NotFound,
  InternalServerError,
  shuffleArray,
  toCamelCase
} = require('../utils');
const _ = require('lodash');

async function getCartDetails(req, res) {
  const { q } = req.query;
  const menus = q;

  if(!Array.isArray(q)){
    throw new BadRequest('Invalid cart query');
  }

  const filter = {
    where: {
      id: {
        in: menus
      }
    },
    select: {
      id: true,
      name: true,
      price: true,
      discount: true,
      veg: true,
      image: true,
    },
  };

  const data = await prisma.menus.findMany(filter);
  res.set('Cache-Control', 'public, max-age=120, must-revalidate');
  res.json(toCamelCase(data));
}

async function getMenus(req, res) {

  let { s, t, v } = req.query;
  s = +s;
  t = +t;
  v = +v;

  let skip = _.isNaN(s) ? 0 : s;
  let take = _.isNaN(t) ? 20 : ((t === 0) ? 10 : 10);
  let veg = _.isNaN(v) ? 'all' : Boolean(v);

  if(skip > 50) skip = 0;

  const filter = {
    skip: skip,
    take: take,
    where: {
      AND: [{
        active: true,
        }, {
          kitchens: {
            active: true,
          },
        }, {
        dishes: {
           active: true
        },
        }
      ],
    },
    select: {
      id: true,
      name: true,
      price: true,
      discount: true,
      veg: true,
      image: true,
      recommended: true,
      servings: true,
      kitchens: {
        select: {
          id: true,
          name: true
        }
      }
    },
  };

  if(veg !== 'all'){
    filter.where.AND.push({
      veg: veg
    })
  }
 
  let menus = await prisma.menus.findMany(filter);
  menus = shuffleArray(menus);
  menus.sort((a,b)=> b.recommended - a.recommended);
  res.set('Cache-Control', 'public, max-age=120, must-revalidate');
  return res.json(toCamelCase(menus));
}

async function getSpecificMenu(req, res) {
  const { menuId } = req.params;

  const filter = {
    where: {
      id: menuId,
      AND: {
        active: true,
        kitchens: {
           active: true,
        },
        dishes: {
           active: true,
        },
      },
    },
    select: {
      id: true,
      name: true,
      description: true,
      price: true,
      image: true,
      veg: true,
      recommended: true,
      servings: true,
      kitchens: {
        select: {
          id: true,
          name: true
        }
      }
    },
  }

  let menu = await prisma.menus.findFirst(filter);
  res.set('Cache-Control', 'public, max-age=120, must-revalidate');
  res.json(toCamelCase(menu));
}

async function getMenusForSpecificKitchen(req, res) {
  const { kitchenId } = req.params;

  let { s, t, v } = req.query;
  s = +s;
  t = +t;
  v = +v;

  let skip = _.isNaN(s) ? 0 : s;
  let take = _.isNaN(t) ? 20 : ((t === 0) ? 10 : 10);
  let veg = _.isNaN(v) ? 'all' : Boolean(v);

  if(skip > 50) skip = 0;

  const filter = {
    skip: skip,
    take: take,
    where: {
      kitchen_id: kitchenId,
      AND: {
        active: true,
        kitchens: {
           active: true,
        },
        dishes: {
           active: true,
        },
      },
    },
    select: {
      id: true,
      name: true,
      description: true,
      price: true,
      image: true,
      veg: true,
      recommended: true,
      servings: true
    },
  }

  if(veg !== 'all'){
    filter.where.AND.dishes = {
      veg: veg
    }
  }

  let menus = await prisma.menus.findMany(filter);
  menus = shuffleArray(menus);
  menus.sort((a,b)=> b.recommended - a.recommended);
  res.set('Cache-Control', 'public, max-age=120, must-revalidate');
  res.json(toCamelCase(menus));
}

async function getDishesForSpecificKitchen(req, res) {
  const { kitchenId } = req.params;

  let { s, t, v } = req.query;
  s = +s;
  t = +t;
  v = +v;

  let skip = _.isNaN(s) ? 0 : s;
  let take = _.isNaN(t) ? 10 : ((t === 0) ? 10 : 10);
  let veg = _.isNaN(v) ? 'all' : Boolean(v);

  if(skip > 50) skip = 0;

  const filter = {
    where: {
      AND: {
        kitchen_id: kitchenId,
        active: true,
        kitchens: {
           active: true,
        },
        dishes: {
           active: true,
        },
      },
    },
    select: {
      id: true,
      name: true,
      dishes: {
        select: {   
          id: true,
          name: true,
          veg: true,
          image: true,
        }
      }
    }
  }

  if(veg !== 'all'){
    filter.where.AND.dishes = {
      veg: veg
    }
  }

  let data = await prisma.menus.findMany(filter);
  data = shuffleArray(data);
  res.json(toCamelCase(data));
}

async function getKitchensForSpecificDish(req, res) {
  const { dishId } = req.params;

  let { s, t, v } = req.query;
  s = +s;
  t = +t;
  v = +v;

  let skip = _.isNaN(s) ? 0 : s;
  let take = _.isNaN(t) ? 10 : ((t === 0) ? 10 : 10);
  let veg = _.isNaN(v) ? 'all' : Boolean(v);

  if(skip > 50) skip = 0;

  const filter = {
    where: {
      dish_id: dishId,
      AND: {
        active: true,
        kitchens: {
           active: true,
        },
        dishes: {
           active: true,
        },
      },
    },
    select: {
      id: true,
      price: true,
      kitchens: {
        select: {
          id: true,
          name: true,
          description: true,
          image: true,
        }
      }
    },
  }

  if(veg !== 'all'){
    filter.where.AND.dishes = {
      veg: veg
    }
  }

  let data = await prisma.menus.findMany(filter);
  data = shuffleArray(data);
  res.json(toCamelCase(data));
}

module.exports = {
  getCartDetails,
  getMenus,
  getSpecificMenu,
  getMenusForSpecificKitchen,
  getKitchensForSpecificDish,
  getDishesForSpecificKitchen
}