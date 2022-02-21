const express = require("express");
const router = express.Router();

const {
  send,
  checkAuth,
  validate,
} = require('../middleware/common');

const {
  renewToken,
  logIn,
  logOut,
  getPreferences,
  savePreferences,
} = require('../controllers/user');

const schema = require('../validators/user');

const { checkFlood } = require('../controllers/flood');

router.post("/login", 
  validate(schema.logIn),
  checkFlood,
  logIn
);
router.get("/renew_token", checkAuth, renewToken);
router.get("/preferences", checkAuth, getPreferences, send);
router.put("/save-preferences",
  checkAuth,
  validate(schema.preferences),
  savePreferences,
  send
);

router.put("/change-password",
  checkAuth,
  validate(schema.changePassword),
  savePreferences,
  send
);

router.post("/logout", logOut);

module.exports = router;
