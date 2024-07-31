const {
  addCustomer,
  getCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerById,
  addCustomerByExcelSheet,
} = require("../controllers/customersController");

const router = require("express").Router();

router.post("/customer/add", addCustomer);
router.get("/customer", getCustomer);
router.get("/customer/:id", getCustomerById);
router.put("/customer/:id", updateCustomer);
router.delete("/customer/:id", deleteCustomer);

router.post("/exportdata/customer", addCustomerByExcelSheet);
module.exports = router;
