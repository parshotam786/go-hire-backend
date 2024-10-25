const {
  getAllValueOfList,
  addValueOfList,
  getAllSubNameList,
  getAllValueList,
  removeValueListController,
  updateListValue,
  updateValueListStatus,
} = require("../controllers/ListValueController");

const router = require("express").Router();

router.get("/list", getAllValueList);
// router.get("/sub-category", getAllSubCategory);
router.get("/value-list", getAllValueOfList);
router.get("/value-sub-list", getAllSubNameList);
router.post("/value-list", addValueOfList);
router.put("/value-list", updateValueListStatus);
router.put("/list-value/update", updateListValue);
router.delete("/value-list/:id", removeValueListController);

module.exports = router;
