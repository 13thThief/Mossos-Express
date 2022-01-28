'use strict';

const { PrismaClient } = require('@prisma/client');
const errorFormat = process.env.NODE_ENV === 'production' ? 'minimal' : 'pretty';
const prisma = global.prisma || new PrismaClient({
  // log: ['query', 'info', `warn`, `error`],
  errorFormat: errorFormat
});
if (process.env.NODE_ENV === 'development')
  global.prisma = prisma;

// prisma.$use(async (params, next) => {
//   const before = Date.now()
//   const result = await next(params)
//   const after = Date.now()
//   console.log(`Query ${params.model}.${params.action} took ${after - before}ms`)
//   return result
// })

module.exports = prisma;