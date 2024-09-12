const { getAllFilterDataWithType } = require("../controllers/publicController");

const router = require("express").Router();

router.post("/get-filter-data", getAllFilterDataWithType);

module.exports = router;
