'use strict';

const prisma = require('../db');
const sendgrid = require('@sendgrid/mail');
sendgrid.setApiKey(process.env.SENDGRID_API_KEY);
const {
  isValidEmail,
  isDisposableEmail,
  isPlusEmail,
  asyncCreateId,
  hashPassword,
  comparePasswords,
  asyncNanoid,
  BadRequest,
  InternalServerError,
  decrypt,
  issueJWT,
  decodeJWT
} = require('../utils');
const _ = require('lodash');
const commonPassword = require('common-password-checker');

const tokenSet = new Set();
const userSet = new Set();

module.exports = {
  signup,
  verifyNewAccount,
  verifyAll,
  login,
  logout,
  forgotPassword,
  newPassword,
  issueNewToken,
  tokenSet
}

async function signup(req, res, next) {
  const { firstName, lastName, phone,
    email, password1, password2, /*inviteCode*/ } = req.body;

  if(_.isEmpty(firstName) || _.isEmpty(lastName) || _.isEmpty(phone) || _.isEmpty(email) ||
    _.isEmpty(password1) ||  _.isEmpty(password2) /* || _.isEmpty(inviteCode) */
    ) {
    throw new BadRequest('Require all fields');
  }

  if (!isValidEmail(email)) {
    throw new BadRequest('Invalid email');
  }
  if (isPlusEmail(email)) {
    throw new BadRequest('Plus "+" sign in email not allowed');
  }
  if (isDisposableEmail(email)) {
    throw new BadRequest('Disposable email not allowed');
  }
  if (password1 && password1.length < 8) {
    throw new BadRequest('Password length should be atleast 8');
  }
  if (password1 && password1.length > 100) {
    throw new BadRequest('Password too long');
  }
  if (password1 !== password2) {
    throw new BadRequest('Passwords do not match');
  }
  if (commonPassword(password1)) {
    throw new BadRequest('Your password is too common');
  }

  // Generate code, save to db, send via email, set expiration
  const [ userId, verificationCode, hashedPassword ] = await Promise.all(
    [ asyncCreateId(), asyncNanoid(20), hashPassword(password1) ]
    );

  let user;
  try {
    user = await prisma.users.create({
      data: {
        id: userId,
        phone: phone,
        email: email,
        first_name: firstName,
        last_name: lastName,
        password: hashedPassword,
        tokens: {
          create: {
            new_account_token: verificationCode
          },
        },
      },
      include: {
        tokens: true,
      },
    })
  } catch (e) {
    if(e.code === 'P2002'){
      throw new BadRequest('Email or phone already in use');
    } else throw new InternalServerError('Registration failed');
  }

  res.json(jsonBuilder('Please check your email to verify your account'));

  // Background job

  const msg = {
    to: email,
    from: {
      email: 'support@mossos.in',
      name: 'Mossos'
    },
    bcc: [process.env.SENDGRID_EMAIL],
    replyTo: process.env.SENDGRID_EMAIL,
    template_id: process.env.SENDGRID_CONFIRM_EMAIL,
    dynamic_template_data: {
      user_name: firstName,
      magic_link: `${process.env.API_DOMAIN}/universe/verify/${user.id}/${user.tokens.new_account_token}`
    }
  }

  sendgrid.send(msg)
    .then(() => console.log('Email sent:', firstName))
    .catch((e) => {
      console.error(e)
    })
}

async function verifyAll(req, res) {
  const updateUsers = await prisma.users.updateMany({
    where: {
      verified: false
    },
    data: {
      verified: true
    },
  })
  res.sendStatus(200);
}

async function verifyNewAccount(req, res) {
  const { userId, hash } = req.params;

  let user = await prisma.users.findUnique({
    where: {
      id: userId
    },
    include: {
      tokens: true,
    },
  });

  if(!user){
    throw new BadRequest('Email id not registered');
  }

  if(user.verified){
    res.redirect(`${process.env.DOMAIN}/login`);
  }
  
  let token = user.tokens.new_account_token;
  
  if(hash !== token){
    throw new BadRequest('Invalid token');
  }

  user = await prisma.users.update({
    where: {
      id: user.id,
    },
    data: {
      verified: true,
      tokens: {
        update: {
          new_account_token: null
        }
      }
    },
  })

  res.redirect(`${process.env.DOMAIN}/login`)
}

async function login(req, res, next){
  const { email, password } = req.body;

  if (_.isEmpty(email) || _.isEmpty(password)) {
    throw new BadRequest('Require email & password');
  }
  if (!isValidEmail(email)) {
    throw new BadRequest('Invalid email');
  }
  if (isPlusEmail(email)) {
    throw new BadRequest('Plus "+" sign in email not allowed');
  }
  if (isDisposableEmail(email)) {
    throw new BadRequest('Disposable email not allowed');
  }
  if(password && password.length < 8){
    throw new BadRequest('Password length should be atleast 8');
  }
  if (password && password.length > 100) {
    throw new BadRequest('Password too long');
  }

  const user = await prisma.users.findUnique({
    where: {
      email: email
    },
    include: {
      bans: true
    },
  })

  if (!user) {
    throw new BadRequest('Email id not registered');
  }

  if(user.ban_id !== 1){
    throw new BadRequest(user.bans.reason);
  }

  if(!user.verified){
    throw new BadRequest('Please check your email/spam for verification');
  }

  let isValidPassword;
  try {
    isValidPassword = await comparePasswords(password, user.password);
  } catch(e) {
    throw new InternalServerError('Password confirmation error');
  }
  
  if (!isValidPassword) {
    throw new BadRequest('Wrong password');
  }

  const token = issueJWT(user);
  tokenSet.add(token);
  userSet.add(email);

  res.status(200).json({ token, user: {
    id: user.id,
    first_name: user.first_name,
    last_name: user.last_name,
    addressExists: !!user.address_id
  }});

  // Background job
  prisma.users.update({
    where: {
      id: user.id,
    },
    data: {
      last_login: new Date(),
    },
  }).catch(console.log)
}

async function logout (req, res) {
  const token = req.get('token');
  tokenSet.delete(token);
  res.sendStatus(200);
}

async function newPassword (req, res) {

  const { password1, password2, pulsar } = req.body;
  
  if (_.isEmpty(pulsar) || _.isEmpty(password1) || _.isEmpty(password2)) {
    throw new BadRequest('Require all fields');
  }
  if (password1 && password1.length < 8) {
    throw new BadRequest('Password length should be atleast 8');
  }
  if (password1 && password1.length > 100) {
    throw new BadRequest('Password too long');
  }
  if (password1 !== password2) {
    throw new BadRequest('Passwords do not match');
  }
  if (commonPassword(password1)) {
    throw new BadRequest('Your password is too common');
  }

  let token, user, password;
  try {
    token = await prisma.tokens.findFirst({
      where: {
        new_password_token: pulsar
      }
    })

    if(_.isEmpty(token)){
      throw new BadRequest('Invalid token');
    }

    password = await hashPassword(password1)

    user = await prisma.users.update({
      where: {
        id: token.user_id,
      },
      data: {
        password: password,
        tokens: {
          update: {
            new_password_token: null
          }
        }
      },
    })
  } catch(e) {
    console.error(e)
    throw new InternalServerError('Error in finding user');
  }

  res.json({message: 'Password reset successful'});
}

async function forgotPassword (req, res) {
  const { email } = req.body;
  
  if (_.isEmpty(email)) {
    throw new BadRequest('Require email');
  }
  if (!isValidEmail(email)) {
    throw new BadRequest('Invalid email');
  }
  if (isDisposableEmail(email)) {
    throw new BadRequest('Disposable email not allowed');
  }
  if (isPlusEmail(email)) {
    throw new BadRequest('Plus "+" sign in email not allowed');
  }

  let user;
  try {
    user = await prisma.users.findUnique({
      where: {
        email: email
      }
    })
  } catch(e) {
    console.error(e);
    throw new InternalServerError('Error in finding user');
  }

  if (!user) {
    throw new BadRequest('No such email registered');
  }

  if(!user.verified){
     throw new BadRequest('Please verify your email first. Check inbox or spam');
  }

  let passwordToken = await asyncNanoid(20);

  let token;
  try {
    token = await prisma.tokens.findFirst({
      where: {
        user_id: user.id
      }
    })

    if (token.new_password_token) {
      return res.json({ message: 'Check your email for the reset link'});
    }

    token = await prisma.tokens.update({
      where: {
        user_id: user.id,
      },
      data: {
        new_password_token: passwordToken
      },
    })
  } catch(e) {
    console.error(e);
    throw new InternalServerError('Error in resetting password');
  }
  
  res.json({ message: 'Check your email for the reset link'});

  const msg = {
    to: email,
    from: {
      email: process.env.EMAIL_SUPPORT,
      name: process.env.EMAIL_NAME
    },
    template_id: process.env.SENDGRID_FORGOT_PASSWORD,
    dynamic_template_data: {
      magic_link: `${process.env.DOMAIN}/new-password?pulsar=${token.new_password_token}`
    }
  }

  sendgrid.send(msg)
    .then(() => console.log('Reset sent'))
    .catch((e) => {
      console.error(e)
    })
}

async function issueNewToken(encryptedToken) {
  let decryptedToken = decrypt(encryptedToken);
  let { user } = decodeJWT(decryptedToken);
  let newToken = issueJWT({ id: user });
  tokenSet.add(newToken);
  return newToken;
}

function jsonBuilder(message){
  return {
    message
  }
}