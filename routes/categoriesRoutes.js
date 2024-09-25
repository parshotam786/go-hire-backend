const router = require("express").Router();

const {
  getAllCategory,
  addCategory,
  getAllCategoryList,
  updateCategoryStatus,
  getAllSubCategory,
  removeCategoryController,
  updateCategory,
  getAllSubCategoryList,
} = require("../controllers/categoriesController");

router.get("/category", getAllCategory);
router.get("/sub-category", getAllSubCategory);
router.get("/category-list", getAllCategoryList);
router.get("/category-sub-list", getAllSubCategoryList);
router.post("/category", addCategory);
router.put("/category", updateCategoryStatus);
router.put("/category/update", updateCategory);
router.delete("/category/:id", removeCategoryController);

module.exports = router;
