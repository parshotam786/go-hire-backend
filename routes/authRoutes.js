const router = require("express").Router();

const {
  AdminLogin,
  AdminRegister,
  AdminDirectory,
  VenderRegister,
  UserProfile,
  VenderLogin,
  updateVenderStatus,
  VenderDirectory,
  updateProfilePicture,
  getProfilePicture,
  updateUserdata,
  updateVendorStatus,
  removeVenderAccount,
  getVendorDashboardStats,
  updateBrandLogo,
  getBrandLogo,
  emailVerifyController,
} = require("../controllers/authController");
const {
  invoiceAddData,
  GetInvoiceListById,
  getInvoiceById,
  deleteInvoice,
} = require("../controllers/invoiceController");
const {
  addProduct,
  ProductList,
  getProductsByVendorId,
  removeProduct,
} = require("../controllers/productController");
const allowedRoles = require("../utiles/allowRoles");
const { authenticateUser } = require("../utiles/userAccessMiddleware");
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
router.post("/vender-verify", emailVerifyController);
router.post("/vender/status", updateVenderStatus);
router.get("/admin-directory", AdminDirectory);
router.get("/vender/directory", VenderDirectory);
router.get("/vender/profile/:id", UserProfile);
router.put("/vender/profile-picture/:id", updateProfilePicture);
router.put("/vender/brand-logo/:id", updateBrandLogo);
router.delete("/vender/:id", removeVenderAccount);

router.put("/vender/:id", updateUserdata);
router.put("/vender/update-status/:id", updateVendorStatus);
router.post("/vender/invoice", invoiceAddData);
router.get("/vender/invoice/list/:id", GetInvoiceListById);
router.get("/vender/invoice/list/view/:id", getInvoiceById);
router.delete("/vender/invoice/list/view/:id", deleteInvoice);
router.get(
  "/vendor/stats",
  authenticateUser,
  // require("./orderRoutes"),
  // allowedRoles(["Seller", "Editor", "Operator"]),
  getVendorDashboardStats
);

// router.post("/add-product", upload.array("image", 5), addProduct);
// router.post("/delete-product", removeProduct);
// router.delete("/delete-product/:productId", removeProduct);
// router.get("/product-list", ProductList);
// router.post("/product-lists", getProductsByVendorId);

module.exports = router;
