const router = require("express").Router();

const {
  generateInvoiceBatchNumber,
  getAllInvoiveBatches,
  deleteInvoiceBatchById,
  getInvocieBatchById,
  removeOrderFromInvoiceBatch,
  confrimInvoiceBatchStatus,
  getInvoiceById,
  invoicePrint,
  postSingleInvoice,
  postMulipleInvoice,
  confrimInvoice,
  multipleInvoicePrint,
  payInvoicePayment,
} = require("../controllers/invoiceBatches");
const authorizeAction = require("../utiles/authorizeAction");

router.post(
  "/invoice-run",
  authorizeAction(["Admin", "Seller"], "Invoice Run"),
  generateInvoiceBatchNumber
);
router.get("/invoice-batches", getAllInvoiveBatches);
router.delete(
  "/:id",
  authorizeAction(["Admin", "Seller"], "Delete Batch"),
  deleteInvoiceBatchById
);
router.delete(
  "/invoice-batches/:invoiceBatchId/orders/:orderId",
  authorizeAction(["Admin", "Seller"], "Delete Single Invoice"),
  removeOrderFromInvoiceBatch
);

router.get("/invoice-batches/:id", getInvocieBatchById);
router.post("/invoice-view", getInvoiceById);
router.post("/invoice-print", invoicePrint);
router.post("/multiple-invoice-print", multipleInvoicePrint);
router.post(
  "/invoice-post",
  authorizeAction(["Admin", "Seller"], "Posted Single Invoice"),
  postSingleInvoice
);
router.post(
  "/invoice-post-all",
  authorizeAction(["Admin", "Seller"], "Posted Batch"),
  postMulipleInvoice
);
router.put(
  "/invoice-status",
  authorizeAction(["Admin", "Seller"], "Confirm Batch"),
  confrimInvoiceBatchStatus
);
router.post(
  "/invoice-confirmed",
  authorizeAction(["Admin", "Seller"], "Confirm Single Invoice"),
  confrimInvoice
);
router.post("/invoice-payment-pay", payInvoicePayment);

module.exports = router;
