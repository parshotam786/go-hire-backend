const router = require('express').Router();
const multer = require("multer");

const {
    // range
    getRange,
    addRange,
    _multiData
} = require("../controllers/rangeController");
const { protect } = require("../middleware/authMiddleware");

// router.post('/createRange', range);
// // router.get('/getAllRange', range);
// router.get('/getWeights', range);
// router.get('/getCities', range);
// router.post('/createWeight', range);
// router.get('/getWeight', range);


// multer setup for file upload
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post('/range', addRange); // add cities and add weight by id agar id do gy to weight hoga wrna city
router.get('/range', getRange); // get cities and get city by id
router.post('/range/uploadfile', upload.single("name"), _multiData)

module.exports = router;