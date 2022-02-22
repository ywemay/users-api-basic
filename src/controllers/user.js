"use strict";

var mongoose = require("mongoose");
var bcrypt = require("bcryptjs");
var jwt = require("jsonwebtoken");

var _require = require('../middleware/send'),
    sendNotFound = _require.sendNotFound,
    sendData = _require.sendData,
    sendUnauthorized = _require.sendUnauthorized,
    sendError = _require.sendError,
    sendInvalid = _require.sendInvalid;

var User = require("../models/user");
var UserController = require("./users");

var _require2 = require('../utils/object'),
    keyFilter = _require2.keyFilter;

var _require3 = require('../utils/validators'),
    isUserName = _require3.isUserName,
    isEmail = _require3.isEmail,
    isLangKey = _require3.isLangKey,
    isPassword = _require3.isPassword;

var _require4 = require('../controllers/flood'),
    registerFailedLogin = _require4.registerFailedLogin;

var TOKEN_OPTIONS = { expiresIn: "1d" };
var JWT_KEY = process.env.JWT_KEY;

function getAuthData(user) {
  var _id = user._id,
      roles = user.roles,
      username = user.username,
      name = user.name,
      avatar = user.avatar,
      language = user.language;

  var payload = { uid: _id, roles: roles };
  return {
    token: jwt.sign(payload, JWT_KEY, TOKEN_OPTIONS),
    user: { roles: roles, username: username, name: name, avatar: avatar, language: language }
  };
}

exports.renewToken = function (req, res, next) {
  var uid = req.userData.uid;

  if (!uid) {
    return sendUnauthorized(res);
  }
  if (!uid) return sendUnauthorized(res);
  User.findOne({ _id: uid, enabled: true }, function (err, user) {
    if (err) return sendUnauthorized(res, { err: err });
    res.data = getAuthData(user);
    return sendData(res);
  }).catch(function (err) {
    return sendUnauthorized(res, { err: err });
  });
};

function logLoggedIn(_id, cb) {
  User.updateOne({ _id: _id }, { lastLogIn: new Date() }).exec().then(cb).catch(function (err) {
    console.log(err);
    cb();
  });
}

function loginFail(req, res) {
  registerFailedLogin(req, function () {
    return sendUnauthorized(res);
  });
}

exports.logIn = function (req, res, next) {
  var _req$body = req.body,
      username = _req$body.username,
      password = _req$body.password;

  console.log("Credentials: " + username);
  console.log(req.body);
  if (!username || !password) {
    return sendUnauthorized(res);
  }
  User.findOne({ username: username, enabled: true }, function (err, user) {
    if (err) return sendUnauthorized(res, { err: err });
    if (!user) return loginFail(req, res);
    var password_hash = user.password_hash;

    if (bcrypt.compareSync(password, password_hash)) {
      res.data = getAuthData(user);
      logLoggedIn(user._id, function () {
        console.log('User logged in', user.username);
      });
      return sendData(res);
    }
    console.log("Login fail ..." + username);
    loginFail(req, res);
  }).catch(function (err) {
    return sendUnauthorized(res, { err: err });
  });
};

exports.logOut = function (req, res) {
  res.data = { message: 'OK' };
  sendData(res);
};

exports.getPreferences = function (req, res, next) {
  var uid = req.userData.uid;

  User.findOne({ _id: uid }, {
    _id: false,
    avatar: 1,
    username: 1,
    email: 1,
    name: 1,
    language: 1
  }, function (err, user) {
    if (err) return sendError(res, err);
    delete user.roles;
    delete user.password_hash;
    res.data.item = user;
    next();
  });
};

exports.savePreferences = function (req, res, next) {
  req.params.uid = req.userData.uid;
  UserController.update(req, res, next);
};