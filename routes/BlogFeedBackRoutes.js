const express = require("express");
const { BlogFeedBackController } = require("../controllers/BlogFeedBack");
const router = express.Router();
router.post("/feedback", BlogFeedBackController);

module.exports = router;
