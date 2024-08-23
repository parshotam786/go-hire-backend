const express = require("express");
const {
  qucikBookAuth,
  quickbookCallback,
  quickBookPayments,
  disconnectQuickBook,
} = require("../controllers/quickbookController");
const router = express.Router();

router.get("/auth", qucikBookAuth);
router.get("/callback", quickbookCallback);
router.get("/payments", quickBookPayments);
router.post("/disconnect-quickbook", disconnectQuickBook);

module.exports = router;
