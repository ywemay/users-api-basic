const yup = require('yup');
const { hasRole, roles } = require('../data/roles');
const { schemaAndKeys } = require('./common');

const SHAPE = {
  avatar: yup.string(),
  username: yup.string().min(3).max(25).required(),
  password: yup.string().min(6).max(25).required(),
  name: yup.string().notRequired(),
  email: yup.string().email().required(),
  language: yup.string().oneOf(['en', 'zh']),
  enabled: yup.boolean(),
  roles: yup.array().of(yup.string().oneOf(roles)),
};

exports.schema = yup.object().shape(SHAPE);

exports.preferences = () => {
  return schemaAndKeys(exports.schema, [
    'avatar',
    'username',
    'name',
    'email',
    'language',
    'contact',
  ]);
}

exports.logIn = () => {
  return schemaAndKeys(exports.schema, [
    'username',
    'password',
  ]);
}

exports.changePassword = () => {
  return schemaAndKeys(exports.schema, [
    'password',
  ]);
}

exports.newUser = ({req}) => {
  const { SELLER } = roles;
  if (hasRole(req.userData, SELLER)) {
    const keys = [
      'avatar',
      'username',
      'name',
      'email',
      'language',
    ];
    return schemaAndKeys(this.schema, keys);
  }
  const keys = Object.keys(SHAPE);
  return schemaAndKeys(this.schema, [...keys, 'contact']);
}

exports.update = ({req}) => {
  const pickKeys = Object.keys(req.body);
  return this.schema.pick(pickKeys);
}
