const ImportData = require("../models/ImportDataModel");
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads");
  },
  filename: (req, file, cb) => {
    cb(null, "template_" + Date.now() + file.originalname);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 8000000 },
});
const ImportDataTemplate = async (req, res) => {
  try {
    const { name } = req.body;

    const template = req.file.path;

    const importdata = new ImportData({
      name,
      template,
    });

    await importdata.save();
    res.status(201).json({
      message: "Service created successfully",
      success: true,
      importdata,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

const GetImportData = async (req, res) => {
  try {
    // Fetch all import data records
    const importDataList = await ImportData.find();

    if (importDataList.length === 0) {
      return res.status(404).json({
        message: "No data found",
        success: false,
      });
    }

    // Send the fetched data
    res.status(200).json({
      message: "Data fetched successfully",
      success: true,
      data: importDataList,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server error",
      success: false,
      error: error.message,
    });
  }
};

module.exports = {
  ImportDataTemplate: [upload.single("template"), ImportDataTemplate],
  GetImportData,
};
