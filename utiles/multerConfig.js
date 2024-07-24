const multer = require("multer");
const path = require("path");
// Set storage engine
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images");
  },
  filename: (req, file, cb) => {
    cb(null, "profile_" + Date.now() + path.extname(file.originalname));
  },
});
// Initialize upload
const upload = multer({
  storage: storage,
  limits: { fileSize: 8000000 }, // Limit file size to 1MB
  fileFilter: (req, file, cb) => {
    checkFileType(file, cb);
  },
}).single("profile_Picture"); // 'profile_Picture' is the field name for the file
// Check file type
function checkFileType(file, cb) {
  const filetypes = /jpeg|jpg|png|gif/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb("Error: Images Only!");
  }
}
module.exports = upload;
