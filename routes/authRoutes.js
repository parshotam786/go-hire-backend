const router = require("express").Router();

const {
  AdminLogin,
  AdminRegister,
  AdminDirectory,
  VenderRegister,
  VenderLogin,
  updateVenderStatus,
  VenderDirectory,
  updateVendorPassword,
  forgotVendorPassword,
  verifyOtp,
  resetPassword,
  UserRegister,
  UserLogin,
  VerifyUserOtp,
  UpdateUserPassword,
  ForgotUserPassword,
  ResetUserPassword,
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
// const {
//   addProduct,
//   ProductList,
//   getProductsByVendorId,
//   removeProduct,
// } = require("../controllers/productController");
// const router = require("express").Router();
// const path = require("path");

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, "images");
//   },
//   filename: (req, file, cb) => {
//     cb(null, Date.now() + path.extname(file.originalname));
//   },
// });

// const upload = multer({
//   storage: storage,
//   limits: {
//     fileSize: 10 * 1024 * 1024, // 10 MB in bytes
//   },
//   fileFilter: (req, file, cb) => {
//     // Accept images only
//     if (!file.mimetype.startsWith("image/")) {
//       return cb(new Error("Only image files are allowed!"), false);
//     }
//     cb(null, true);
//   },
// });

router.post("/admin-register", AdminRegister);
router.post("/admin-login", AdminLogin);
router.post("/vender-register", VenderRegister);
router.post("/vender-login", VenderLogin);
router.post("/vender/status", updateVenderStatus);
router.get("/admin-directory", AdminDirectory);
router.get("/vender/directory", VenderDirectory);
router.post("/vender-update-password/:id", protect, updateVendorPassword);
router.post("/vender-forgot-password", forgotVendorPassword);
router.post("/vender-verify", verifyOtp);
router.post("/vender-reset-password", protect, resetPassword);
router.post("/user-register", UserRegister);
router.post("/user-login", UserLogin);
router.post("/user-verify", VerifyUserOtp);
router.post("/user-update-password/:id", protect, UpdateUserPassword);
router.post("/user-forgot-password", ForgotUserPassword);
router.post("/user-reset-password", protect, ResetUserPassword);

// router.post("/add-product", upload.array("image", 5), addProduct);
// router.post("/delete-product", removeProduct);
// router.delete("/delete-product/:productId", removeProduct);
// router.get("/product-list", ProductList);
// router.post("/product-lists", getProductsByVendorId);

module.exports = router;
