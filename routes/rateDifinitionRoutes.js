const express = require("express");
const router = express.Router();
const rateDefinitionController = require("../controllers/rateDifinitionController");

// POST route to create a new rate definition
router.get("/list", rateDefinitionController.getRateDefinitionList);

router.post("/", rateDefinitionController.createRateDefinition);
router.get("/", rateDefinitionController.getRateDefinitionController);
router.put("/:id", rateDefinitionController.updateRateDefinition);
router.get("/:id", rateDefinitionController.getRateDefinitionById);
router.delete("/:id", rateDefinitionController.deleteRateDefinitionController);

module.exports = router;
