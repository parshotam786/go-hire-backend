
  
  const express = require("express");
const { getOrder, createOrder, getAllOrders, addProductInOrder } = require("../controllers/orderController");
const allowedRoles = require("../utiles/allowRoles");
  
  const router = express.Router();
  
  router.get("/get-all-orders",getAllOrders);
  router.get("/:id",getOrder );
  router.post("/create-order",allowedRoles(['Seller']),createOrder);
  router.patch("/update-products",
    // allowedRoles(['Vendor']),
    addProductInOrder);



  
  module.exports = router;