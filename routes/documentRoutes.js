const express = require("express");
const {
  createDocument,
  getDocuments,
  getDocumentById,
  updateDocumentById,
} = require("../controllers/documentsController");
const allowedRoles = require("../utiles/allowRoles");
const router = express.Router();

/**
 * @openapi
 * /api/document/doucment-number:
 *   post:
 *     summary: Create a new document
 *     tags:
 *       - Document
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               code:
 *                 type: string
 *               mask:
 *                 type: string
 *               seed:
 *                 type: number
 *               identityMinimumLength:
 *                 type: number
 *               domain:
 *                 type: string
 *               resetSeedFlag:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Document created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *               name:
 *                 type: string
 *               code:
 *                 type: string
 *               mask:
 *                 type: string
 *               seed:
 *                 type: number
 *               identityMinimumLength:
 *                 type: number
 *               domain:
 *                 type: string
 *               resetSeedFlag:
 *                 type: booleang
 *       400:
 *         description: Bad request
 */
router.post("/doucment-number", createDocument, allowedRoles(["Seller"]));

/**
 * @openapi
 * /api/document/doucment-number:
 *   get:
 *     summary: Retrieve a list of documents
 *     tags:
 *       - Document
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of documents
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                 _id:
 *                   type: string
 *               name:
 *                 type: string
 *               code:
 *                 type: string
 *               mask:
 *                 type: string
 *               seed:
 *                 type: number
 *               identityMinimumLength:
 *                 type: number
 *               domain:
 *                 type: string
 *               resetSeedFlag:
 *                 type: booleang
 */
router.get("/doucment-number", getDocuments, allowedRoles(["Seller"]));

/**
 * @openapi
 * /api/document/doucment-number/{id}:
 *   get:
 *     summary: Retrieve a document by ID
 *     tags:
 *       - Document
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID of the document
 *         schema:
 *           type: string
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Document details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *               name:
 *                 type: string
 *               code:
 *                 type: string
 *               mask:
 *                 type: string
 *               seed:
 *                 type: number
 *               identityMinimumLength:
 *                 type: number
 *               domain:
 *                 type: string
 *               resetSeedFlag:
 *                 type: booleang
 *       404:
 *         description: Document not found
 */
router.get("/doucment-number/:id", getDocumentById, allowedRoles(["Seller"]));

/**
 * @openapi
 * /api/document/doucment-number/{id}:
 *   put:
 *     summary: Update a document by ID
 *     tags:
 *       - Document
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID of the document
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               order:
 *                 type: string
 *               code:
 *                 type: string
 *               mask:
 *                 type: string
 *               seed:
 *                 type: string
 *     responses:
 *       200:
 *         description: Document updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 title:
 *                   type: string
 *                 content:
 *                   type: string
 *                 author:
 *                   type: string
 *       400:
 *         description: Bad request
 *       404:
 *         description: Document not found
 */
router.put("/doucment-number/:id", updateDocumentById, allowedRoles(["Seller"]));

module.exports = router;
