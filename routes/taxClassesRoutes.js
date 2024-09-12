const express = require("express");

const {
  addTaxClass,
  getAllTaxList,
  updateTaxClass,
  getTaxClass,
  deleteTaxClass,
  getAlTaxClasslProducts,
  getAlTaxClasslAccount,
} = require("../controllers/taxClassesController");
const allowedRoles = require("../utiles/allowRoles");
const router = express.Router();
router.post("/add", addTaxClass, allowedRoles(["Seller"]));
router.get("/list", getAllTaxList, allowedRoles(["Seller"]));
router.get("/product", getAlTaxClasslProducts, allowedRoles(["Seller"]));
router.get("/account", getAlTaxClasslAccount, allowedRoles(["Seller"]));
router.get("/:id", getTaxClass, allowedRoles(["Seller"]));
router.put("/update/:id", updateTaxClass, allowedRoles(["Seller"]));
router.delete("/:id", deleteTaxClass, allowedRoles(["Seller"]));

module.exports = router;
