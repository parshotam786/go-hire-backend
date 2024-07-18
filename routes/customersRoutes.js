const {
  addCustomer,
  getCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerById,
} = require("../controllers/customersController");

const router = require("express").Router();

router.post("/customer/add", addCustomer);
router.get("/customer", getCustomer);
router.get("/customer/:id", getCustomerById);
router.put("/customer/:id", updateCustomer);
router.delete("/customer/:id", deleteCustomer);

module.exports = router;
