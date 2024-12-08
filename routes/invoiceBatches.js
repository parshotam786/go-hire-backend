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
router.delete("/:id", deleteInvoiceBatchById);
router.delete(
  "/invoice-batches/:invoiceBatchId/orders/:orderId",
  removeOrderFromInvoiceBatch
);

router.get("/invoice-batches/:id", getInvocieBatchById);
router.post("/invoice-view", getInvoiceById);
router.post("/invoice-print", invoicePrint);
router.post("/multiple-invoice-print", multipleInvoicePrint);
router.post("/invoice-post", postSingleInvoice);
router.post("/invoice-post-all", postMulipleInvoice);
router.put("/invoice-status", confrimInvoiceBatchStatus);
router.post("/invoice-confirmed", confrimInvoice);
router.post("/invoice-payment-pay", payInvoicePayment);

module.exports = router;
