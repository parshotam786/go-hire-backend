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

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images");
  },
  filename: (req, file, cb) => {
    console.log({ file });
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
  updateProduct
);
router.delete("/delete-product/:productId", removeProduct);
router.get("/product-detail/:id", getProudctById);
router.delete("/product/:productId/image", deleteProductImage);
router.get("/product-list", ProductList);
router.post("/product-lists", getProductsByVendorId);
router.get("/product/list", getProductsBySearch);

module.exports = router;
