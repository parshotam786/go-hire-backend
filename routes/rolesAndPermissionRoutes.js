const express = require("express");
const {
  addRole,
  getRoleByVendorId,
} = require("../controllers/rolesAndPermisson");

const router = express.Router();

router.post("/role", addRole);
router.get("/role", getRoleByVendorId);

module.exports = router;
