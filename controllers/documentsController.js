// controllers/documentsController.js
const Documents = require("../models/documentNumber");

const createDocument = async (req, res) => {
  const {
    name,
    code,
    mask,
    seed,
    identityMinimumLength,
    domain,
    resetSeedFlag,
  } = req.body;

  const { _id: vendorId } = req.user;
  console.log(vendorId);
  const namess = await Documents.findOne({ name });
  if (namess) {
    res.status(400).json({ message: "Name already exist" });
  }

  try {
    const newDocument = new Documents({
      vendorId,
      name,
      code,
      mask,
      seed,
      identityMinimumLength,
      domain,
      resetSeedFlag,
    });

    const savedDocument = await newDocument.save();

    // Send response
    res.status(201).json(savedDocument);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating document", error: error.message });
  }
};

// get documents
const getDocuments = async (req, res) => {
  const { _id: vendorId } = req.user;
  console.log(vendorId);

  try {
    const documents = await Documents.find({ vendorId });
    if (!documents) {
      return res.status(404).json({ message: "Documents not found" });
    }
    res.status(200).json({ documents, success: true });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error retrieving documents", error: error.message });
  }
};

const getDocumentById = async (req, res) => {
  const { id } = req.params;

  try {
    const document = await Documents.findById(id);
    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }
    res.status(200).json({ document, success: true });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error retrieving document", error: error.message });
  }
};

const updateDocumentById = async (req, res) => {
  const { id } = req.params;
  const {
    name,
    code,
    mask,
    seed,
    identityMinimumLength,
    domain,
    resetSeedFlag,
  } = req.body;

  try {
    const existingDocument = await Documents.findById(id);
    if (!existingDocument) {
      return res.status(404).json({ message: "Document not found" });
    }

    if (parseInt(seed) <= parseInt(existingDocument.seed)) {
      return res.status(400).json({
        message: "invalid seed number!",
        success: false,
      });
    }

    const updatedDocument = await Documents.findByIdAndUpdate(
      id,
      {
        name,
        code,
        mask,
        ...(resetSeedFlag ? { seed } : {}),
        identityMinimumLength,
        domain,
        resetSeedFlag,
        counter: resetSeedFlag ? 0 : existingDocument.counter,
      },
      { new: true } // This option returns the modified document rather than the original
    );

    res.status(200).json({
      updatedDocument,
      success: true,
      message: "Record updated successfully!",
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating document", error: error.message });
  }
};

module.exports = {
  createDocument,
  getDocuments,
  getDocumentById,
  updateDocumentById,
};
