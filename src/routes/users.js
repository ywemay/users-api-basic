const express = require("express");
const router = express.Router();

const {
  send,
  checkAuth,
  validate,
} = require('../middleware/common');

const uc = require('../controllers/users');
const perm = require('../permissions/users');
const authAction = require('../middleware/action-auth');

const schema = require('../validators/user');

router.get("/",
  checkAuth,
  authAction(perm.canList),
  uc.setSearchFilter,
  uc.countDocuments,
  uc.list,
  send
);

router.post("/",
  checkAuth,
  authAction(perm.canPost),
  validate(schema.newUser),
  uc.create,
  send
);

router.get("/:uid",
  checkAuth,
  uc.getItem,
  authAction(perm.canView),
  send
);

router.put("/:uid",
  checkAuth,
  uc.getItem,
  authAction(perm.canPut),
  validate(schema.update),
  uc.update,
  send
);

router.delete("/:uid",
  checkAuth,
  uc.hasContent,
  uc.getItem,
  authAction(perm.canDelete),
  uc.del,
  send
);


module.exports = router;
