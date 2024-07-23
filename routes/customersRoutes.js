const {
  addCustomer,
  getCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerById,
  deleteCustomerOrder,
} = require("../controllers/customersController");

const router = require("express").Router();

router.post("/customer/add", addCustomer);
router.get("/customer", getCustomer);
router.get("/customer/:id", getCustomerById);
router.put("/customer/:id", updateCustomer);
router.delete("/customer/:id", deleteCustomer);
router.delete("/customer/order/:id", deleteCustomerOrder);

module.exports = router;
