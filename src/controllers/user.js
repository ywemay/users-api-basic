const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const {
  sendNotFound,
  sendData,
  sendUnauthorized,
  sendError,
  sendInvalid
} = require('../middleware/send');
const User = require("../models/user");
const UserController = require("./users");
const { keyFilter } = require('../utils/object');
const {
  isUserName,
  isEmail,
  isLangKey,
  isPassword,
} = require('../utils/validators');
const { registerFailedLogin } = require('../controllers/flood');

const TOKEN_OPTIONS = { expiresIn: "1d" };
const JWT_KEY = process.env.JWT_KEY;

function getAuthData(user) {
  const { _id, roles, username, name, avatar, language } = user;
  const payload = { uid: _id, roles }
  return {
    token: jwt.sign(payload, JWT_KEY, TOKEN_OPTIONS),
    user: { roles, username, name, avatar, language },
  };
}

exports.renewToken = (req, res, next) => {
  const { uid } = req.userData;
  if (!uid) {
    return sendUnauthorized(res);
  }
  if (!uid) return sendUnauthorized(res);
  User.findOne({_id: uid, enabled: true}, function(err, user){
    if (err) return sendUnauthorized(res, {err});
    res.data = getAuthData(user);
    return sendData(res);
  })
  .catch(err => sendUnauthorized(res, {err}));
};

function logLoggedIn(_id, cb) {
  User.updateOne({_id}, { lastLogIn: new Date() }).exec()
  .then(cb)
  .catch(err => {
    console.log(err);
    cb();
  });
}

function loginFail(req, res) {
  registerFailedLogin(req, () => sendUnauthorized(res));
}

exports.logIn = (req, res, next) => {
  const { username, password } = req.body;
  console.log(`Credentials: ${username}`)
  console.log(req.body)
  if (!username || !password) {
    return sendUnauthorized(res);
  }
  User.findOne({username, enabled: true}, function(err, user) {
    if (err) return sendUnauthorized(res, {err});
    if (!user) return loginFail(req, res);
    const { password_hash } = user;
    if (bcrypt.compareSync(password, password_hash)) {
      res.data = getAuthData(user);
      logLoggedIn(user._id, () => {
        console.log('User logged in', user.username);
      });
      return sendData(res);
    }
    console.log("Login fail ..." + username)
    loginFail(req, res);
  })
  .catch(err => sendUnauthorized(res, {err}));
}

exports.logOut = (req, res) => {
  res.data = { message: 'OK' };
  sendData(res);
}

exports.getPreferences = (req, res, next) => {
  const { uid } = req.userData
  User.findOne({_id: uid}, {
    _id: false,
    avatar: 1,
    username: 1,
    email: 1,
    name: 1,
    language: 1,
  }, (err, user) => {
    if (err) return sendError(res, err);
    delete user.roles;
    delete user.password_hash;
    res.data.item = user;
    next();
  });
}

exports.savePreferences = (req, res, next) => {
  req.params.uid = req.userData.uid;
  UserController.update(req, res, next);
}
