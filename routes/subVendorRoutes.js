const express = require("express");
const {
  createEditorOrOperator,
  getAllSubVendor,
  updateSubVendorStatus,
} = require("../controllers/subVendorControler");
const router = express.Router();

router.post("/create-sub-user", createEditorOrOperator);
router.get("/all-sub-user", getAllSubVendor);
router.put("/sub-user-status", updateSubVendorStatus);

module.exports = router;
