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

/**
 * @openapi
 * /add-product:
 *   post:
 *     summary: Adds a new product
 *     tags:
 *       - Products
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: The name of the product
 *               description:
 *                 type: string
 *                 description: The description of the product
 *               price:
 *                 type: number
 *                 format: float
 *                 description: The price of the product
 *               image:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Product added successfully
 *       400:
 *         description: Bad request
 */
router.post("/add-product", upload.array("image", 5), addProduct);

/**
 * @openapi
 * /update-product/{productId}:
 *   put:
 *     summary: Updates a product
 *     tags:
 *       - Products
 *     parameters:
 *       - name: productId
 *         in: path
 *         required: true
 *         description: ID of the product to update
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *                 format: float
 *               image:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Product updated successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Product not found
 */
router.put(
  "/update-product/:productId",
  upload.array("image", 5),
  updateProduct
);

/**
 * @openapi
 * /delete-product/{productId}:
 *   delete:
 *     summary: Deletes a product
 *     tags:
 *       - Products
 *     parameters:
 *       - name: productId
 *         in: path
 *         required: true
 *         description: ID of the product to delete
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product deleted successfully
 *       404:
 *         description: Product not found
 */
router.delete("/delete-product/:productId", removeProduct);

/**
 * @openapi
 * /product-detail/{id}:
 *   get:
 *     summary: Retrieves product details
 *     tags:
 *       - Products
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID of the product to retrieve
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 description:
 *                   type: string
 *                 price:
 *                   type: number
 *                   format: float
 *                 images:
 *                   type: array
 *                   items:
 *                     type: string
 *       404:
 *         description: Product not found
 */
router.get("/product-detail/:id", getProudctById);

/**
 * @openapi
 * /product/{productId}/image:
 *   delete:
 *     summary: Deletes an image of a product
 *     tags:
 *       - Products
 *     parameters:
 *       - name: productId
 *         in: path
 *         required: true
 *         description: ID of the product
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Image deleted successfully
 *       404:
 *         description: Product or image not found
 */
router.delete("/product/:productId/image", deleteProductImage);

/**
 * @openapi
 * /product-list:
 *   get:
 *     summary: Retrieves a list of products
 *     tags:
 *       - Products
 *     responses:
 *       200:
 *         description: A list of products
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   description:
 *                     type: string
 *                   price:
 *                     type: number
 *                     format: float
 *                   images:
 *                     type: array
 *                     items:
 *                       type: string
 */
router.get("/product-list", ProductList);

/**
 * @openapi
 * /product-lists:
 *   post:
 *     summary: Retrieves products by vendor ID
 *     tags:
 *       - Products
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               vendorId:
 *                 type: string
 *     responses:
 *       200:
 *         description: List of products for the given vendor
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   description:
 *                     type: string
 *                   price:
 *                     type: number
 *                     format: float
 *                   images:
 *                     type: array
 *                     items:
 *                       type: string
 */
router.post("/product-lists", getProductsByVendorId);

/**
 * @openapi
 * /product/list:
 *   get:
 *     summary: Retrieves products by search criteria
 *     tags:
 *       - Products
 *     parameters:
 *       - name: query
 *         in: query
 *         description: Search query
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of products matching the search criteria
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   description:
 *                     type: string
 *                   price:
 *                     type: number
 *                     format: float
 *                   images:
 *                     type: array
 *                     items:
 *                       type: string
 */
router.get("/product/list", getProductsBySearch);

/**
 * @openapi
 * /api/product/description:
 *   post:
 *     summary: Generates a product description using OpenAI
 *     tags:
 *       - OpenAI
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               prompt:
 *                 type: string
 *                 description: The prompt for generating the product description
 *     responses:
 *       200:
 *         description: Generated product description
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 description:
 *                   type: string
 */
router.post("/product/description", OpenAIHandler);

module.exports = router;
