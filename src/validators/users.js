const yup = require('yup');
const { ROLE, hasRole } = require('../data/roles')
const { ADMIN, MANAGER, SELLER } = ROLE;
const MANAGEMENT = [ ADMIN, MANAGER ];

const { schema } = require('./user');

exports.createNew = ({req}) => {

  if (hasRole(req.userData, SELLER)) {
    return schema.omit(['roles', 'enabled']);
  }

  return schema;
};
