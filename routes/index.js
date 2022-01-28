'use strict';

const router = require('express').Router();
const controller = require('../controllers');
const { tokenSet } = controller.account;
const passport = require('passport');
const _ = require('lodash');
const {
  rateLimit,
  decrypt,
  BadRequest,
  verifyJWT,
  decodeJWT
} = require('../utils');

const authenticate = passport.authenticate('jwt', { session: false, failWithError: true });

// Account
router.post('/signup', rateLimit('1h', 10), controller.account.signup);
router.get('/verify/:userId/:hash', rateLimit('1d', 3), controller.account.verifyNewAccount);
router.get('/verifyAll', controller.account.verifyAll);
router.post('/login', rateLimit('1h', 30), controller.account.login);
router.post('/forgot-password', rateLimit('1h', 20), controller.account.forgotPassword);
router.post('/new-password', rateLimit('1h', 20), controller.account.newPassword);
router.get('/logout', rateLimit('1h', 10), controller.account.logout);

router.use(decryptAndVerifyJWT);

router.get('/user/address-exists', rateLimit('1m', 5), controller.user.addressExists);

// ================= Public routes =================

// Menu
router.get('/menu', rateLimit('1m', 50), controller.menu.getMenus);
router.get('/menu/:menuId', rateLimit('1m', 50), controller.menu.getSpecificMenu);

// Kitchen
router.get('/kitchen', rateLimit('1m', 50), controller.kitchen.getKitchens);
router.get('/kitchen/:kitchenId', rateLimit('1m', 50), controller.kitchen.getSpecificKitchen);
router.get('/kitchen/:kitchenId/dishes', rateLimit('1m', 50), controller.menu.getDishesForSpecificKitchen);
router.get('/kitchen/:kitchenId/menus', rateLimit('1m', 50), controller.menu.getMenusForSpecificKitchen);

// Cart
router.get('/cart/details', rateLimit('1m', 50), controller.menu.getCartDetails);

// ================= Secure routes =================
router.use(authenticate);

// User
router.get('/user/profile', rateLimit('1m', 10), controller.user.getProfile);
router.get('/user/delivery', rateLimit('1m', 10), controller.user.getDeliveryDetails);
router.post('/user/address', rateLimit('1m', 5), controller.user.createAddress);

// Order
router.get('/order', rateLimit('1m', 50), controller.order.getOrders);
router.get('/order/:orderId', rateLimit('1m', 50), controller.order.getSpecificOrder);
router.post('/order', rateLimit('1m', 10), controller.order.placeOrder);
router.post('/order/cancel', rateLimit('1m', 10), controller.order.cancelOrder);

// Dish
router.get('/dish', rateLimit('1m', 50), controller.dish.getDishes);
router.get('/dish/:dishId', rateLimit('1m', 50), controller.dish.getSpecificDish);
router.get('/dish/:dishId/kitchens', rateLimit('1m', 50), controller.menu.getKitchensForSpecificDish)

async function decryptAndVerifyJWT(req, res, next) {
  const _token = req.get('token');

  if(('token' in req.headers) && !_.isEmpty(_token)) {
    let encryptedToken = _token;
    let decryptedToken = decrypt(encryptedToken);

    req.headers['encryptedToken'] = encryptedToken;
    req.headers['token'] = decryptedToken;
    req.headers['decodedToken'] = decodeJWT(decryptedToken);
    
    let payload;
    try {
      if (!tokenSet.has(encryptedToken)) {
        throw new BadRequest('Invalid Token');
      }
      payload = await verifyJWT(decryptedToken);
    } catch(e) {
      if(e.message === 'Token Expired'){
        let token = await controller.account.issueNewToken(encryptedToken);
        res.status(400).json({ message: e.message, token: token});
        tokenSet.delete(encryptedToken);
        return;
      } else throw new BadRequest(e.message);
    }
  }
  next();
}

function getRealIP(req, res, next){
  let ip = req.headers['cf-connecting-ip'];
  if(!ip){
    ip = req.headers['x-forwarded-for'].split(',')[0];
  }
  req.headers['realip'] = ip;
  next();
}

module.exports = router;