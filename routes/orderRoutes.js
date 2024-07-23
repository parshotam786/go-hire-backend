const express = require("express");
const {
  getOrder,
  createOrder,
  getAllOrders,
  addProductInOrder,
  deleteCustomerOrder,
  deleteProductFromOrder,
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

router.put("/product", deleteProductFromOrder);
router.delete("/customer/:id", deleteCustomerOrder);

module.exports = router;
