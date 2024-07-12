const router = require('express').Router();

const {
    range
} = require("../controllers/rangeController");
const { protect } = require("../middleware/authMiddleware");

router.post('/createRange', protect, range);
router.get('/getAllRange', protect, range);
router.get('/getWeights', protect, range);
router.get('/getCities', protect, range);
router.post('/createWeight', protect, range);
router.get('/getWeight', protect, range);

module.exports = router;