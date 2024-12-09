const express = require("express");
const {
  createEditorOrOperator,
  getAllSubVendor,
  updateSubVendorStatus,
  getUserProfile,
  updateUserRolesAndPermissions,
} = require("../controllers/subVendorControler");
const checkRole = require("../utiles/authorizeAction");
const router = express.Router();

router.post("/create-sub-user", createEditorOrOperator);
router.get("/all-sub-user", getAllSubVendor);
router.get("/sub-user-profile/:id", getUserProfile);
router.put("/sub-user-role-permissions/:id", updateUserRolesAndPermissions);
router.put("/sub-user-status", updateSubVendorStatus);

module.exports = router;
