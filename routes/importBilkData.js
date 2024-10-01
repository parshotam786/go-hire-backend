const express = require("express");
const { addProductByCSV } = require("../controllers/importBulkDataController");
const router = express.Router();
const multer = require("multer");
const path = require("path");

// Setup multer for CSV uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads"); // Destination folder for CSV files
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // Rename file with timestamp
  },
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    const filetypes = /csv/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Only CSV files are allowed!"));
  },
});

router.post("/product", upload.single("csvFile"), addProductByCSV);

module.exports = router;
