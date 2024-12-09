const {
  addCustomer,
  getCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerById,
} = require("../controllers/customersController");
const authorizeAction = require("../utiles/authorizeAction");

const router = require("express").Router();

router.post(
  "/customer/add",
  authorizeAction(["Admin", "Seller"], "Create Customer"),
  addCustomer
);
router.get(
  "/customer",
  authorizeAction(["Admin", "Seller"], "Customer"),
  getCustomer
);
router.get(
  "/customer/:id",
  authorizeAction(["Admin", "Seller"], "Customer"),
  getCustomerById
);
router.put(
  "/customer/:id",
  authorizeAction(["Admin", "Seller"], "Edit Customer"),
  updateCustomer
);
router.delete(
  "/customer/:id",
  authorizeAction(["Admin", "Seller"], "Delete Customer"),
  deleteCustomer
);

module.exports = router;
