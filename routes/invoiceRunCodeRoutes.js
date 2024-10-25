const {
  createInvoiceRunCode,
  getAllInvoiceRunCode,
  deleteInvoiceRunCodeById,
  updateInvoiceRunCodeById,
  getInvoiceRunCodeById,
} = require("../controllers/invoiceRunCode");

const router = require("express").Router();

router.post("/", createInvoiceRunCode);
router.get("/", getAllInvoiceRunCode);
router.get("/:id", getInvoiceRunCodeById);
router.put("/:id", updateInvoiceRunCodeById);
router.delete("/:id", deleteInvoiceRunCodeById);

module.exports = router;
