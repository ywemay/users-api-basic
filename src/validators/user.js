'use strict';

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var yup = require('yup');

var _require = require('../data/roles'),
    hasRole = _require.hasRole,
    roles = _require.roles;

var _require2 = require('./common'),
    schemaAndKeys = _require2.schemaAndKeys;

var SHAPE = {
  avatar: yup.string(),
  username: yup.string().min(3).max(25).required(),
  password: yup.string().min(6).max(25).required(),
  name: yup.string().notRequired(),
  email: yup.string().email().required(),
  language: yup.string().oneOf(['en', 'zh']),
  enabled: yup.boolean(),
  roles: yup.array().of(yup.string().oneOf(roles))
};

exports.schema = yup.object().shape(SHAPE);

exports.preferences = function () {
  return schemaAndKeys(exports.schema, ['avatar', 'username', 'name', 'email', 'language', 'contact']);
};

exports.logIn = function () {
  return schemaAndKeys(exports.schema, ['username', 'password']);
};

exports.changePassword = function () {
  return schemaAndKeys(exports.schema, ['password']);
};

exports.newUser = function (_ref) {
  var req = _ref.req;
  var SELLER = roles.SELLER;

  if (hasRole(req.userData, SELLER)) {
    var _keys = ['avatar', 'username', 'name', 'email', 'language'];
    return schemaAndKeys(undefined.schema, _keys);
  }
  var keys = Object.keys(SHAPE);
  return schemaAndKeys(undefined.schema, [].concat(_toConsumableArray(keys), ['contact']));
};

exports.update = function (_ref2) {
  var req = _ref2.req;

  var pickKeys = Object.keys(req.body);
  return undefined.schema.pick(pickKeys);
};