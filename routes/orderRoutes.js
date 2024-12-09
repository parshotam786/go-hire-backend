const express = require("express");
const {
  getOrder,
  createOrder,
  getAllOrders,
  addProductInOrder,
  deleteCustomerOrder,
  deleteProductFromOrder,
  getOrderProduct,
  allocateOrderProducts,
  updateOrderProduct,
  generateOrderInvoice,
  bookOrderInvoice,
  updateOrder,
  orderBookOut,
  orderBookIn,
  generateOrderNote,
  invoicePDF,
  invoiceByVendorId,
  getOrdersOnRent,
} = require("../controllers/orderController");
const authorizeAction = require("../utiles/authorizeAction");

const router = express.Router();

router.get("/get-all-orders", getAllOrders);
router.get("/:id", getOrder);
router.post(
  "/create-order",
  authorizeAction(["Admin", "Seller"], "Create Order"),
  createOrder
);
router.put("/update-order/:id", updateOrder);
router.patch(
  "/update-products",
  authorizeAction(["Admin", "Seller"], "Create Order"),
  addProductInOrder
);

router.get("/product/:id", getOrderProduct);
router.put(
  "/product",
  authorizeAction(["Admin", "Seller"], "Create Order"),
  deleteProductFromOrder
);
router.put("/customer", deleteCustomerOrder);
router.put(
  "/product/status",
  authorizeAction(["Admin", "Seller"], "Create Order"),
  allocateOrderProducts
);
router.put(
  "/update-product-items",
  updateOrderProduct,
  authorizeAction(["Admin", "Seller"], "Create Order")
);
router.post("/book", bookOrderInvoice);
router.post("/invoice", generateOrderInvoice);
router.post(
  "/bookout",
  authorizeAction(["Admin", "Seller"], "Book Out Order"),
  orderBookOut
);
router.post(
  "/bookin",
  authorizeAction(["Admin", "Seller"], "Book In Order"),
  orderBookIn
);
router.post(
  "/generate-order-note",
  authorizeAction(["Admin", "Seller"], "Create Order"),
  generateOrderNote
);
router.post(
  "/generate-invoice-pdf",
  authorizeAction(["Admin", "Seller"], "Create Order"),
  invoicePDF
);
router.post("/generate-all", invoiceByVendorId);
router.post("/run-code", getOrdersOnRent);

module.exports = router;
