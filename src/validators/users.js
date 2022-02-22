'use strict';

var yup = require('yup');

var _require = require('../data/roles'),
    ROLE = _require.ROLE,
    hasRole = _require.hasRole;

var ADMIN = ROLE.ADMIN,
    MANAGER = ROLE.MANAGER,
    SELLER = ROLE.SELLER;

var MANAGEMENT = [ADMIN, MANAGER];

var _require2 = require('./user'),
    schema = _require2.schema;

exports.createNew = function (_ref) {
  var req = _ref.req;


  if (hasRole(req.userData, SELLER)) {
    return schema.omit(['roles', 'enabled']);
  }

  return schema;
};