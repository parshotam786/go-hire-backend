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
} = require("../controllers/orderController");
const allowedRoles = require("../utiles/allowRoles");

const router = express.Router();

router.get("/get-all-orders", getAllOrders);
router.get("/:id", getOrder);
router.post("/create-order", createOrder);
router.patch(
  "/update-products",
  // allowedRoles(['Vendor']),
  addProductInOrder
);

router.get("/product/:id", getOrderProduct);
router.put("/product", deleteProductFromOrder);
router.put("/customer", deleteCustomerOrder);
router.put("/product/status", allocateOrderProducts);

module.exports = router;
