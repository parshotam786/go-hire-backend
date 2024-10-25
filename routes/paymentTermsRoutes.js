const {
  createPaymentTerm,
  getAllPaymentTerms,
  getPaymentTermById,
  updatePaymentTermById,
  deletePaymentTermById,
} = require("../controllers/paymentTerms");

const router = require("express").Router();

router.post("/", createPaymentTerm);
router.get("/", getAllPaymentTerms);
router.get("/:id", getPaymentTermById);
router.put("/:id", updatePaymentTermById);
router.delete("/:id", deletePaymentTermById);

module.exports = router;
