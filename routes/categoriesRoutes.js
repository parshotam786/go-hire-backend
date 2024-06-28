const router = require("express").Router();

const {
  getAllCategory,
  addCategory,
} = require("../controllers/categoriesController");

router.get("/category", getAllCategory);
router.post("/category", addCategory);

module.exports = router;
