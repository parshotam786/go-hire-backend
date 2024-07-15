const {
  addCustomer,
  getCustomer,
} = require("../controllers/customersController");

const router = require("express").Router();

router.post("/customer/add", addCustomer);
getCustomer;
router.get("/customer", getCustomer);

module.exports = router;
