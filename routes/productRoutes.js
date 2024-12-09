const {
  addProduct,
  ProductList,
  getProductsByVendorId,
  removeProduct,
  updateProduct,
  getProudctById,
  deleteProductImage,
  getProductsBySearch,
} = require("../controllers/productController");
const multer = require("multer");
const router = require("express").Router();
const path = require("path");
const { OpenAIHandler } = require("../controllers/openAiController");
const authorizeAction = require("../utiles/authorizeAction");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + file.originalname);
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB in bytes
  },
  fileFilter: (req, file, cb) => {
    // Accept images only
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed!"), false);
    }
    cb(null, true);
  },
});

router.post("/add-product", upload.array("image", 5), addProduct);
router.put(
  "/update-product/:productId",
  upload.array("image", 5),
  authorizeAction(["Admin", "Seller"], "Edit Product"),
  updateProduct
);
router.delete(
  "/delete-product/:productId",
  authorizeAction(["Admin", "Seller"], "Delete Product"),
  removeProduct
);
router.get("/product-detail/:id", getProudctById);
router.delete("/product/:productId/image", deleteProductImage);
router.get("/product-list", ProductList);
router.post("/product-lists", getProductsByVendorId);
router.get(
  "/product/list",
  authorizeAction(["Admin", "Seller"], "All Product"),
  getProductsBySearch
);
router.post("/product/description", OpenAIHandler);

module.exports = router;
