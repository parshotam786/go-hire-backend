const router = require("express").Router();

const {
  getAllCategory,
  categoriesByID,
  addCategory,
  subCategoryData,
} = require("../controllers/categoriesController");

router.get("/category", getAllCategory);
router.get("/category/:id", categoriesByID);
router.post("/category", addCategory);
router.post("/category/:id/subcategories", subCategoryData);

module.exports = router;
