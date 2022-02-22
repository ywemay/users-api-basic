'use strict';

var express = require("express");
var router = express.Router();

var _require = require('../middleware/common'),
    send = _require.send,
    checkAuth = _require.checkAuth,
    validate = _require.validate;

var _require2 = require('../controllers/user'),
    renewToken = _require2.renewToken,
    logIn = _require2.logIn,
    logOut = _require2.logOut,
    getPreferences = _require2.getPreferences,
    savePreferences = _require2.savePreferences;

var schema = require('../validators/user');

var _require3 = require('../controllers/flood'),
    checkFlood = _require3.checkFlood;

router.post("/login", validate(schema.logIn), checkFlood, logIn);
router.get("/renew_token", checkAuth, renewToken);
router.get("/preferences", checkAuth, getPreferences, send);
router.put("/save-preferences", checkAuth, validate(schema.preferences), savePreferences, send);

router.put("/change-password", checkAuth, validate(schema.changePassword), savePreferences, send);

router.post("/logout", logOut);

module.exports = router;