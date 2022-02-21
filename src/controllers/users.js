const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/user");
const SaleOrder = require("../models/saleorder");
const { ROLE, hasRole } = require('../data/roles')
const { reqPage } = require("../utils/pagination");
const { scopedFilter } = require("../permissions/users-example");
const { sendError, sendData, ifFound } = require('../middleware/send');
const { keyFilter } = require('../utils/object');
const { generatePassword } = require('../utils/password');

function getAllowedKeys({flags, contact, full} = {}) {
  let keys = [
    '_id',
    'username',
    'avatar',
    'name',
    'roles',
    'enabled',
    'company',
    'seller',
    'language',
    'lastLogIn'
  ];

  if( contact || full )  keys = [...keys, 'email', 'contact'];
  if( flags || full )  keys = [...keys, 'flags'];
  return keys.join(' ');
}

const updateHasContent = (doc, next) => {
  const { seller } = doc;
  const update = { flags:{ hasContent: true } }
  if (seller) {
    User.updateOne({_id: seller}, update)
      .then(() => {
        next();
      })
      .catch(err => {
        console.log('Update seller' + seller, err);
        next();
      });
  }
  else next();
}

exports.setSearchFilter = (req, res, next) => {
  try {
    const { t, roles } = req.query;
    const q = scopedFilter(req.userData);
    if (t) {
      const re = new RegExp(t, 'i');
      q.$or = [{ username: re}, { email: re }, { name: re }];
    }
    if (roles) {
        q.roles = { $in: roles.split(',') };
    }

    const { lastOnline } = req.query;
    if (lastOnline) {
      req.params.sort = { lastLogIn: -1 }
      req.params.limit = 8;
      q.lastLogIn = { $ne: null};
    }

    req.searchFilter = q;
  }
  catch(err) {
    return sendError(res, err);
  }
  // TODO: Implement sorting
  next();
}

exports.countDocuments = (req, res, next) => {
  const page = reqPage(req);
  User.countDocuments(req.searchFilter)
   .then((total) => {
     res.data.pagination = { total, page }
     if (total === 0) {
       res.data.items = [];
       return sendData(res);
     }
     next();
   })
   .catch(err => sendError(res, err));
}

exports.list = (req, res, next) => {
  const { page } = res.data.pagination;
  const user = req.userData;
  const { sort, limit } = req.params;
  User.find(req.searchFilter)
    .select(getAllowedKeys({flags: true}))
    .skip(page.skip)
    .limit(limit || page.limit)
    .sort(sort || {_id: -1})
    .then((items) => {
      res.data.items = items
      next();
    })
    .catch(err => {
      return sendError(res, err);
    })
}

exports.createUser = ({data, alter} = {}) => {
  return new Promise((resolve, reject) =>{
    const user = keyFilter(data, getAllowedKeys({contact: true}));
    const { enabled, password } = data;
    const validPassword = password || generatePassword();
    user.enabled = enabled ? true : false;
    user.password_hash = bcrypt.hashSync(validPassword, bcrypt.genSaltSync(10));
    if (typeof alter === 'function') alter(user);
    const item = new User(user);
    item.save()
      .then((newUser) => {
        updateHasContent(newUser, () => resolve(newUser));
      })
      .catch(err => {
        // str = JSON.stringify(err, null, 4);
        // console.log(str);
        reject(err);
      });
  });
}

exports.create = (req, res, next) => {
  const alter = function(user) {
    if (!user.seller && hasRole(req.userData, ROLE.SELLER)) {
      user.seller = req.userData.uid;
      user.roles = [ROLE.CUSTOMER];
    }
  }
  this.createUser({data: req.body, alter})
    .then((newUser) => {
      const {_id} = newUser;
      res.data = {
        createdItem: { _id }
      }
      next();
    })
    .catch(err => sendError(res, err));
}

exports.getItem = (req, res, next) => {
  let q = scopedFilter(req.userData);
  q._id = req.params.uid;
  User.findOne(q)
    .select(getAllowedKeys({full: true}))
    .exec()
    .then(item => {
      ifFound(item, res, () => {
        res.data.item = item;
        next();
      })
    })
    .catch(err => sendError(res, err))
}

exports.hasContent = (req, res, next) => {
  console.log(req.params.uid)
  const uid = ObjectId(req.params.uid);
  SaleOrder.findOne({$or: [{customer: uid}, {seller: uid}, {confirmed: { by: uid}}]})
    .then(item => {
      if (item) {
        res.data.flags.hasContent = true;
      }
      next();
    })
    .catch(err => sendError(res, err));
}

exports.update = (req, res, next) => {
  const id = req.params.uid;
  const ops = req.body;
  if (ops.password) {
    ops.password_hash = bcrypt.hashSync(ops.password, bcrypt.genSaltSync(10));
  }

  User.updateOne({ _id: id}, { $set: ops })
    .exec()
    .then((result) => {
      res.data = { result, ops };
      updateHasContent(ops, next);
    })
    .catch(err => sendError(res, err));
}

exports.del = (req, res, next) => {
  const id = req.params.uid;
  User.deleteOne({ _id: id })
    .exec()
    .then(result => {
      res.data = {result}
      next()
    })
    .catch(err => sendError(res, err));
}
