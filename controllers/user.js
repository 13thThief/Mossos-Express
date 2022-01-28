'use strict';

const prisma = require('../db');
const {
  asyncCreateId,
  BadRequest,
  NotFound,
  toCamelCase
} = require('../utils');
const _ = require('lodash');

async function getDeliveryDetails(req, res) {
  const token = req.headers['decodedToken'];
  const user = token.user;

  if(_.isEmpty(user)){
    throw new BadRequest('Invalid user Id');
  }

  const filter = {
    where: {
      id: user,
    },
    select: {
      first_name: true,
      last_name: true,
      phone: true,
      email: true,
      addresses: {
        select: {
          flat_no: true,
          building: true,
          street_1: true,
          street_2: true,
          landmark: true,
          serviceable: true
        }
      }
    },
  };

  const data = await prisma.users.findUnique(filter);

  if(!data){
    throw new NotFound('Delivery details of this user not found');
  }

  const name = `${data.first_name} ${data.last_name}`;
  const { addresses: a, phone, email } = data;

  if(!a){
    throw new NotFound('Address not found');
  }

  const address = `${a.flat_no}, ${a.building}, ${a.street_1}${a.street_2 ? ', ' + a.street_2: ''} ${a.landmark ? ', Landmark: ' + a.landmark: ''}`;
  res.set('Cache-Control', 'private, no-cache');
  res.json({
    name,
    address: address.trim(),
    phone,
    email,
    serviceable: a.serviceable
  });
}

async function createAddress(req, res) {
  const userId = req.headers['decodedToken']['user'];

  const { flatNo, building, street1, street2, landmark, location } = req.body;

  const filter = {
    data: {
      id: await asyncCreateId(),
      user_id: userId,
      flat_no: flatNo,
      building,
      street_1: street1,
      street_2: street2,
      landmark,
      location,
      users: {
        connect: {
          id: userId
        }
      }
    }
  }

  let address = await prisma.addresses.create(filter);
  res.sendStatus(200);
}

async function getProfile(req, res) {
  const userId = req.headers['decodedToken']['user'];

  const filter = {
    where: {
      id: userId,
    },
    select: {
      first_name: true,
      last_name: true,
      phone: true,
      email: true,
      addresses: {
        select: {
          flat_no: true,
          building: true,
          street_1: true,
          street_2: true,
          landmark: true,
        }
      }
    },
  };

  const data = await prisma.users.findFirst(filter);
  const name = `${data.first_name} ${data.last_name}`;
  const { addresses: a, phone, email } = data;
  const address = `${a.flat_no}, ${a.building}, ${a.street_1}${a.street_2 ? ', ' + a.street_2: ''} ${a.landmark ? ', Landmark: ' + a.landmark: ''}`;
  data['addresses'] = address;
  res.set('Cache-Control', 'private, no-cache');
  res.json(toCamelCase(data));
}

async function addressExists(req, res) {
  const userId = req.headers['decodedToken']['user'];

  const filter = {
    where: {
      user_id: userId,
    }
  };

  const data = await prisma.addresses.findFirst(filter);
  if(!data)
    return res.json({exists: false})
  return res.json({exists: true})
}

module.exports = {
  getDeliveryDetails,
  createAddress,
  getProfile,
  addressExists,
}