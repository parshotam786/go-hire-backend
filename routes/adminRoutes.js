const { AllVendorList } = require("../controllers/superAdminController");

const router = require("express").Router();

router.get("/vendor-list", AllVendorList);

module.exports = router;
