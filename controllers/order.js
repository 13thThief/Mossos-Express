'use strict';

const prisma = require('../db');
const passport = require('passport');
const {
  asyncCreateId,
  BadRequest,
  InternalServerError,
  asyncCreateNumber,
  validator: v,
  toCamelCase
} = require('../utils');
const _ = require('lodash');
const { DateTime } = require('luxon');

module.exports = {
  placeOrder,
  cancelOrder,
  getOrders,
  getSpecificOrder,
}

async function placeOrder(req, res) {
  const order = req.body;

  const checkOrderSchema = v.checkPlaceOrderType(order);

  const isValidOrder = !Array.isArray(checkOrderSchema);

  if (!isValidOrder) {
    throw new BadRequest('Invalid order')
  }

  let { date, items } = order;

  date = DateTime.fromJSDate(date, {zone: "UTC+05:30"});

  if(!date.isValid){
    throw new BadRequest('Invalid Date');
  }

  let now = DateTime.fromJSDate(new Date());

  let diffInDays = date.diff(now, 'days').toObject().days;

  if(+now > +date) { // || diffInDays < 0
    throw new BadRequest('Invalid order delivery time');
  }

  // Allow max 2 delivery dates from today
  if(date.day === now.day) {
    throw new BadRequest('Delivery date cannot be today');
  }
  
  // Allow max 2 delivery dates from today
  if(diffInDays > 3) { 
    throw new BadRequest('Delivery date too far');
  }

  if(date.hour > 20 || date.hour < 9){
    throw new BadRequest('Delivery time should be between 10 AM & 7 PM');
  }

  const s = new Set();
  for(const item of items){
    s.add(item.menu);
  }

  if(s.size !== items.length){
    throw new BadRequest('Menu items declared multiple times')
  }

  // returns single kitchen id if valid
  const menusFromSameKitchen = await areMenusFromSameKitchen(items);

  if(!menusFromSameKitchen){
    throw new BadRequest('An order should have menu items from the same kitchen');
  }

  const token = req.headers['decodedToken'];
  const userId = token.user;

  const user = await prisma.users.findUnique({
    where: {
      id: userId,
    },
    include: {
      addresses: true
    }
  })

  const menuId = items[0]['menu'];
  let kitchenId = menusFromSameKitchen;

  const orderId = await asyncCreateId();
  const orderNumber = Date.now() + '-' + await asyncCreateNumber();
  const addressId = user.addresses.id;

  let menus;
  // Add respective price for a menu item
  try {
    menus = await prisma.menus.findMany({
      where: {
        id: {
          in: items.map( item => item.menu )
        } 
      },
      select: {
        id: true,
        price: true,
        discount: true
      }
    })
  } catch(e) {
    throw new InternalServerError(e.message);
  }

  // Set item prices
  for(const item of items){
    for(const menu of menus){
      if(menu.id == item.menu){
        item.unitPrice = menu.price;
        item.discount = menu.discount;
      }
    }
  }

  const totalAmount = items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);

  let nextDay = now.plus({days:1});
  let statusId = now.hour >= 19 && date.day === nextDay.day ? 100 : 200;

  // Order object
  const input = {
    data: {
      id: orderId,
      no: orderNumber,
      user_id: userId,
      kitchen_id: kitchenId,
      address_id: addressId,
      amount: totalAmount,
      status_id: statusId,
      delivery_date: date.toISO(),
      items: {
        createMany: {
          data: items.map( item => ({
            // order_id: orderId,
            menu_id: item.menu,
            quantity: item.quantity,
            unit_price: item.unitPrice,
            total_price: item.quantity * item.unitPrice,
            discount: item.discount
          }))
        }
      }
    },
    select: selectBuilder([
      'id',
      'no',
      'user_id',
      'kitchen_id',
      'amount',
      'status_id',
      'delivery_date',
      'items'
    ])
  }

  let createdOrder = await prisma.orders.create(input);

  return res.json(toCamelCase(createdOrder));
}

async function cancelOrder(req, res) {
  const { orderId } = req.body;

  if(!orderId){
    throw new BadRequest('Invalid order Id')
  }

  const token = req.headers['decodedToken'];
  const userId = token.user;

  const filter = {
    where: {
      id: orderId,
      user_id: userId
    }
  }

  let order = await prisma.orders.findFirst(filter);

  if(!order){
    throw new BadRequest('No such order!');
  }

  if (order.status_id !== 200 && order.status_id !== 100) {
    throw new BadRequest('Order should be confirmed or pending approval to be cancelled!');
  }

  order = await prisma.orders.update({
    where: {
      id: orderId
    },
    data: {
      status_id: 400,
      cancellation_date: new Date()
    },
    select: {
      id: true,
      no: true,
      amount: true,
      status_id: true,
      delivery_date: true,
      cancellation_date: true,
      created_at: true,
      items: {
        select: {
          id: true,
          menu_id: true,
          quantity: true,
          unit_price: true,
          total_price: true,
          discount: true,
          menus: {
            select: {
              name: true,
              veg: true
            }
          }
        }
      },
      statuses: {
        select: {
          message: true
        }
      },
      kitchens: {
        select: {
          id: true,
          name: true
        }
      },
      addresses: {
        select: {
          flat_no: true,
          building: true,
          street_1: true,
          street_2: true,
          landmark: true
        }
      }
    },
  })

  if(order.addresses){
    const { addresses: a } = order;
    const address = `${a.flat_no}, ${a.building}, ${a.street_1}${a.street_2 ? ', ' + a.street_2: ''} ${a.landmark ? ', Landmark: ' + a.landmark: ''}`;
    order['addresses'] = address.trim();
  }
  res.json(toCamelCase(order));
}

async function getOrders(req, res) {

  let { s, t } = req.query;
  s = +s;
  t = +t;

  let skip = _.isNaN(s) ? 0 : ((s > 50) ? 0 : s);
  let take = _.isNaN(t) ? 10 : ((t === 0) ? 10 : 10);

  const token = req.headers['decodedToken'];
  const userId = token.user;

  const filter = {
    skip: skip,
    take: take,
    where: {
      user_id: userId,
    },
    orderBy: [
      {
        created_at: 'desc',
      }
    ],
    select: {
      id: true,
      no: true,
      amount: true,
      status_id: true,
      delivery_date: true,
      cancellation_date: true,
      created_at: true,
      items: true,
      kitchens: {
        select: {
          id: true,
          name: true
        }
      },
      statuses: {
        select: {
          message: true
        }
      }
    },
  };

  const data = await prisma.orders.findMany(filter);
  res.set('Cache-Control', 'no-store');
  res.json(toCamelCase(data));
}

async function getSpecificOrder(req, res) {
  const { orderId } = req.params;

  const token = req.headers['decodedToken'];
  const userId = token.user;

  const filter = {
    where: {
      id: orderId
    },
    select: {
      id: true,
      no: true,
      amount: true,
      status_id: true,
      delivery_date: true,
      cancellation_date: true,
      created_at: true,
      items: {
        select: {
          id: true,
          menu_id: true,
          quantity: true,
          unit_price: true,
          total_price: true,
          discount: true,
          menus: {
            select: {
              name: true,
              veg: true
            }
          }
        }
      },
      users: {
        select: {
          id: true
        }
      },
      statuses: {
        select: {
          message: true
        }
      },
      kitchens: {
        select: {
          id: true,
          name: true
        }
      },
      addresses: {
        select: {
          flat_no: true,
          building: true,
          street_1: true,
          street_2: true,
          landmark: true
        }
      }
    },
  }

  let data = await prisma.orders.findUnique(filter);

  if(!data || userId !== data.users?.id){
    throw new BadRequest('');
  }

  if(data.addresses){
    const { addresses: a } = data;
    const address = `${a.flat_no}, ${a.building}, ${a.street_1}${a.street_2 ? ', ' + a.street_2: ''} ${a.landmark ? ', Landmark: ' + a.landmark: ''}`;
    data['addresses'] = address.trim();
  }
  delete data.users;
  res.set('Cache-Control', 'no-store');
  res.json(toCamelCase(data));
}

async function updateOrderStatus(req, res) {
  
  const { orderId, status } = req.body;
  const token = req.headers['decodedToken'];
  const userId = token.user;

  const role = token.role;
  const actions = {};

  if (role === 'user') {
    switch (status) {
      case 400:
      default: throw new BadRequest('Not allowed update order status');
    }
  }

  const updatedOrder = await prisma.orders.update({
    where: {
      id: orderId
    },
    data: {
      status_id: status
    },
  })

  return res.sendStatus(200);
}

// See if menu or kitchen or dish is active
// ie can they be served
async function canBeServed(id, type) {
  let identifier, filter;

  if (type === 'menu') {
    identifier = 'id';
  } else if (type === 'kitchen') {
    identifier = 'kitchen_id';
  } else if (type === 'dish') {
    identifier = 'dish_id';
  } else return false;

  filter = {
    where: {
      [identifier]: id,
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
    intentionalerror: {}
  }

  if (id) {
    try {
      let data = await prisma.menus.findFirst(filter);
      if (data)
        return true;
      return false;
    } catch(e) {
      throw new InternalServerError(e.message);
    }
  }
  return false;
}

async function areMenusFromSameKitchen(items){
  const kitchenCount = new Set();

  try {
    for(const item of items){
      const menuId = item.menu;
      let data = await prisma.menus.findFirst({
        where: {
          id: menuId,
          AND: {
            kitchens: {
              active: true
            },
            dishes: {
              active: true
            }
          }
        },
        select: {
          kitchens: {
            select: {
              id: true
            }
          }
        }
      })

      if(data)
        kitchenCount.add(data.kitchens?.id);
      else kitchenCount.add(data);
    }
  } catch(e) {
    console.log(e)
    throw new InternalServerError('O: Fetching menus failed')
  }

  if(kitchenCount.size > 1)
    return false;
  else if(kitchenCount.size == 1){
    if(kitchenCount.has(null) || kitchenCount.has([])){
      return false;
    }
  }
  let kc = kitchenCount.values().next().value;
  if(!kc)
    return false;
  return kc;
}

function selectBuilder(arr) {
  return Object.fromEntries(arr.map(key => [key, true]));
}
