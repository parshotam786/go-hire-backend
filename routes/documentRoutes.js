const express = require("express");
const {
  createDocument,
  getDocuments,
  getDocumentById,
  updateDocumentById,
} = require("../controllers/documentsController");
const allowedRoles = require("../utiles/allowRoles");
const router = express.Router();
router.post("/doucment-number", createDocument, allowedRoles(["Seller"]));
router.get("/doucment-number", getDocuments, allowedRoles(["Seller"]));
router.get("/doucment-number/:id", getDocumentById, allowedRoles(["Seller"]));
router.put(
  "/doucment-number/:id",
  updateDocumentById,
  allowedRoles(["Seller"])
);

module.exports = router;
