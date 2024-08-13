const router = require("express").Router();
const {
  getAllCategory,
  addCategory,
} = require("../controllers/categoriesController");

/**
 * @openapi
 * /api/category:
 *   get:
 *     summary: Retrieve all categories if you dont pass the parentId. to get sub category add parentId
 *     tags:
 *       - Category
 *     parameters:
 *       - in: query
 *         name: parentId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A list of categories
 *         content:
 *           application/json:
 *             schema:
 */
router.get("/category", getAllCategory);

/**
 * @openapi
 * /api/category:
 *   post:
 *     summary: Add a new category
 *     tags:
 *       - Category
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               parentId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Category created successfully
 *         content:
 *           application/json:
 *             schema:
 *       400:
 *         description: Bad request
 */
router.post("/category", addCategory);

module.exports = router;
