'use strict';

var express = require("express");
var router = express.Router();

var _require = require('../middleware/common'),
    send = _require.send,
    checkAuth = _require.checkAuth,
    validate = _require.validate;

var uc = require('../controllers/users');
var perm = require('../permissions/users');
var authAction = require('../middleware/action-auth');

var schema = require('../validators/user');

router.get("/", checkAuth, authAction(perm.canList), uc.setSearchFilter, uc.countDocuments, uc.list, send);

router.post("/", checkAuth, authAction(perm.canPost), validate(schema.newUser), uc.create, send);

router.get("/:uid", checkAuth, uc.getItem, authAction(perm.canView), send);

router.put("/:uid", checkAuth, uc.getItem, authAction(perm.canPut), validate(schema.update), uc.update, send);

router.delete("/:uid", checkAuth, uc.hasContent, uc.getItem, authAction(perm.canDelete), uc.del, send);

module.exports = router;