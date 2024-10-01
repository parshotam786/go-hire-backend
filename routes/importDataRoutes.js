const {
  ImportDataTemplate,
  GetImportData,
} = require("../controllers/ImportDataController");

const router = require("express").Router();

router.post("/import-data", ImportDataTemplate);
router.get("/import-data", GetImportData);

module.exports = router;
