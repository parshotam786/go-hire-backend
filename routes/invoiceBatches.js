const router = require("express").Router();

const {
  generateInvoiceBatchNumber,
  getAllInvoiveBatches,
  deleteInvoiceBatchById,
  getInvocieBatchById,
} = require("../controllers/invoiceBatches");

router.post("/invoice-run", generateInvoiceBatchNumber);
router.get("/invoice-batches", getAllInvoiveBatches);
router.delete("/:id", deleteInvoiceBatchById);
router.get("/invoice-batches/:id", getInvocieBatchById);

module.exports = router;
