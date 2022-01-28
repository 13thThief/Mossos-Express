'use strict';

const JWTStrategy = require('passport-jwt').Strategy
const ExtractJWT = require('passport-jwt').ExtractJwt;

const { RSA_PRI_KEY, RSA_PUB_KEY, HS_KEY } = require('../utils/keys');

const ALGORITHM = process.env.JWT_ALGORITHM === 'symmetric' ? 'HS256' : 'RS256';
const KEY = ALGORITHM === 'HS256' ? HS_KEY : RSA_PUB_KEY;

const prisma = require('../db');

const options = {
  jwtFromRequest: ExtractJWT.fromHeader('token'),
  secretOrKey: KEY,
  algorithms: [ALGORITHM]
};

const strategy = new JWTStrategy(options, async (payload, done) => {
  try {
    const user = await prisma.users.findUnique({
                    where: {
                      id: payload.user
                    },
                  });

    if (user) {
      return done(null, user);
    } else {
      return done(null, false);
    }
  } catch(e){
    console.error('new Strategy Error', e)
      return done(e, false);
  }
})

module.exports = strategy;