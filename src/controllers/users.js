"use strict";

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var mongoose = require("mongoose");
var ObjectId = mongoose.Types.ObjectId;
var bcrypt = require("bcryptjs");
var jwt = require("jsonwebtoken");

var User = require("../models/user");
var SaleOrder = require("../models/saleorder");

var _require = require('../data/roles'),
    ROLE = _require.ROLE,
    hasRole = _require.hasRole;

var _require2 = require("../utils/pagination"),
    reqPage = _require2.reqPage;

var _require3 = require("../permissions/users-example"),
    scopedFilter = _require3.scopedFilter;

var _require4 = require('../middleware/send'),
    sendError = _require4.sendError,
    sendData = _require4.sendData,
    ifFound = _require4.ifFound;

var _require5 = require('../utils/object'),
    keyFilter = _require5.keyFilter;

var _require6 = require('../utils/password'),
    generatePassword = _require6.generatePassword;

function getAllowedKeys() {
  var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
      flags = _ref.flags,
      contact = _ref.contact,
      full = _ref.full;

  var keys = ['_id', 'username', 'avatar', 'name', 'roles', 'enabled', 'company', 'seller', 'language', 'lastLogIn'];

  if (contact || full) keys = [].concat(_toConsumableArray(keys), ['email', 'contact']);
  if (flags || full) keys = [].concat(_toConsumableArray(keys), ['flags']);
  return keys.join(' ');
}

var updateHasContent = function updateHasContent(doc, next) {
  var seller = doc.seller;

  var update = { flags: { hasContent: true } };
  if (seller) {
    User.updateOne({ _id: seller }, update).then(function () {
      next();
    }).catch(function (err) {
      console.log('Update seller' + seller, err);
      next();
    });
  } else next();
};

exports.setSearchFilter = function (req, res, next) {
  try {
    var _req$query = req.query,
        t = _req$query.t,
        roles = _req$query.roles;

    var q = scopedFilter(req.userData);
    if (t) {
      var re = new RegExp(t, 'i');
      q.$or = [{ username: re }, { email: re }, { name: re }];
    }
    if (roles) {
      q.roles = { $in: roles.split(',') };
    }

    var lastOnline = req.query.lastOnline;

    if (lastOnline) {
      req.params.sort = { lastLogIn: -1 };
      req.params.limit = 8;
      q.lastLogIn = { $ne: null };
    }

    req.searchFilter = q;
  } catch (err) {
    return sendError(res, err);
  }
  // TODO: Implement sorting
  next();
};

exports.countDocuments = function (req, res, next) {
  var page = reqPage(req);
  User.countDocuments(req.searchFilter).then(function (total) {
    res.data.pagination = { total: total, page: page };
    if (total === 0) {
      res.data.items = [];
      return sendData(res);
    }
    next();
  }).catch(function (err) {
    return sendError(res, err);
  });
};

exports.list = function (req, res, next) {
  var page = res.data.pagination.page;

  var user = req.userData;
  var _req$params = req.params,
      sort = _req$params.sort,
      limit = _req$params.limit;

  User.find(req.searchFilter).select(getAllowedKeys({ flags: true })).skip(page.skip).limit(limit || page.limit).sort(sort || { _id: -1 }).then(function (items) {
    res.data.items = items;
    next();
  }).catch(function (err) {
    return sendError(res, err);
  });
};

exports.createUser = function () {
  var _ref2 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
      data = _ref2.data,
      alter = _ref2.alter;

  return new Promise(function (resolve, reject) {
    var user = keyFilter(data, getAllowedKeys({ contact: true }));
    var enabled = data.enabled,
        password = data.password;

    var validPassword = password || generatePassword();
    user.enabled = enabled ? true : false;
    user.password_hash = bcrypt.hashSync(validPassword, bcrypt.genSaltSync(10));
    if (typeof alter === 'function') alter(user);
    var item = new User(user);
    item.save().then(function (newUser) {
      updateHasContent(newUser, function () {
        return resolve(newUser);
      });
    }).catch(function (err) {
      // str = JSON.stringify(err, null, 4);
      // console.log(str);
      reject(err);
    });
  });
};

exports.create = function (req, res, next) {
  var alter = function alter(user) {
    if (!user.seller && hasRole(req.userData, ROLE.SELLER)) {
      user.seller = req.userData.uid;
      user.roles = [ROLE.CUSTOMER];
    }
  };
  undefined.createUser({ data: req.body, alter: alter }).then(function (newUser) {
    var _id = newUser._id;

    res.data = {
      createdItem: { _id: _id }
    };
    next();
  }).catch(function (err) {
    return sendError(res, err);
  });
};

exports.getItem = function (req, res, next) {
  var q = scopedFilter(req.userData);
  q._id = req.params.uid;
  User.findOne(q).select(getAllowedKeys({ full: true })).exec().then(function (item) {
    ifFound(item, res, function () {
      res.data.item = item;
      next();
    });
  }).catch(function (err) {
    return sendError(res, err);
  });
};

exports.hasContent = function (req, res, next) {
  console.log(req.params.uid);
  var uid = ObjectId(req.params.uid);
  SaleOrder.findOne({ $or: [{ customer: uid }, { seller: uid }, { confirmed: { by: uid } }] }).then(function (item) {
    if (item) {
      res.data.flags.hasContent = true;
    }
    next();
  }).catch(function (err) {
    return sendError(res, err);
  });
};

exports.update = function (req, res, next) {
  var id = req.params.uid;
  var ops = req.body;
  if (ops.password) {
    ops.password_hash = bcrypt.hashSync(ops.password, bcrypt.genSaltSync(10));
  }

  User.updateOne({ _id: id }, { $set: ops }).exec().then(function (result) {
    res.data = { result: result, ops: ops };
    updateHasContent(ops, next);
  }).catch(function (err) {
    return sendError(res, err);
  });
};

exports.del = function (req, res, next) {
  var id = req.params.uid;
  User.deleteOne({ _id: id }).exec().then(function (result) {
    res.data = { result: result };
    next();
  }).catch(function (err) {
    return sendError(res, err);
  });
};