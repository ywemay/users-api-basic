'use strict';

var _require = require('../data/roles'),
    ROLE = _require.ROLE,
    hasRole = _require.hasRole;

var ADMIN = ROLE.ADMIN,
    MANAGER = ROLE.MANAGER,
    SELLER = ROLE.SELLER,
    CUSTOMER = ROLE.CUSTOMER;


exports.canView = function (user, item) {
  return hasRole(user, [ADMIN, MANAGER, SELLER]);
};

exports.canList = function (user) {
  return hasRole(user, [ADMIN, MANAGER, SELLER]);
};

exports.scopedFilter = function (user) {
  if (user.roles.includes(ADMIN)) return {};
  if (user.roles.includes(MANAGER)) return {
    roles: { $nin: [ADMIN] }
  };
  if (user.roles.includes(SELLER)) {
    return {
      roles: CUSTOMER,
      seller: user.uid
      // enabled: true,
    };
  }
  return {
    _id: user.uid
  };
};

exports.canPost = function (user, item, _ref) {
  var reqPage = _ref.reqPage,
      req = _ref.req;

  return hasRole(user, ADMIN) || hasRole(user, MANAGER) && !hasRole(req.body, ADMIN) // manager can't create admin account
  || hasRole(user, SELLER) && !hasRole(req.body, [ADMIN, MANAGER, SELLER]) // seller can't create admin account
  ;
};

exports.canPut = function (user, item) {
  var _ref2 = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {},
      req = _ref2.req;

  if (hasRole(user, ADMIN)) return true;
  if (user.roles.includes(MANAGER) && !hasRole(item, ADMIN) && !hasRole(req.body, ADMIN)) return true;
  var roles = [ADMIN, MANAGER, SELLER];
  if (user.roles.includes(SELLER) && !hasRole(item, roles) && !hasRole(req.body, roles)) return true;
  return false;
};

exports.canDelete = function (user, item) {
  var _ref3 = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {},
      flags = _ref3.flags,
      req = _ref3.req;

  var hasContent = flags.hasContent;
  var itemHasContent = item.flags.itemHasContent;

  if (hasContent || itemHasContent) return false;
  if (user.roles.includes(ADMIN)) return true;
  if (user.roles.includes(MANAGER) && !hasRole(item, ADMIN)) return true;
  var roles = [ADMIN, MANAGER, SELLER];
  if (user.roles.includes(SELLER) && !hasRole(item, roles) && (item.seller ? item.seller.toString() : undefined) === user.uid) return true;
  return false;
};