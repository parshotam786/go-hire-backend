const router = require("express").Router();

const {
  generateInvoiceBatchNumber,
  getAllInvoiveBatches,
  deleteInvoiceBatchById,
  getInvocieBatchById,
  removeOrderFromInvoiceBatch,
  confrimInvoiceBatchStatus,
} = require("../controllers/invoiceBatches");

router.post("/invoice-run", generateInvoiceBatchNumber);
router.get("/invoice-batches", getAllInvoiveBatches);
router.delete("/:id", deleteInvoiceBatchById);
router.delete(
  "/invoice-batches/:invoiceBatchId/orders/:orderId",
  removeOrderFromInvoiceBatch
);

router.get("/invoice-batches/:id", getInvocieBatchById);
router.put("/invoice-status", confrimInvoiceBatchStatus);

module.exports = router;
