
  
  const express = require("express");
const { getOrder, createOrder, getAllOrders } = require("../controllers/orderController");
  
  const router = express.Router();
  
  router.get("/:id",getOrder );
  router.post("/create-order",createOrder);
  router.get("/get-all-orders",getAllOrders);


  
  module.exports = router;