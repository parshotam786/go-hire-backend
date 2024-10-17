const Product = require("../models/productModel");
const taxClassesModel = require("../models/taxClassesModel");

// Controller to add a new tax class
const addTaxClass = async (req, res) => {
  try {
    const {
      type,
      name,
      description,
      defaultStatus,
      postcode,
      country,
      taxRate,
    } = req.body;
    const { _id: vendorId } = req.user;
    console.log(vendorId);
    // Check for required fields
    if (!name) {
      return res.status(400).json({ message: "Name required." });
    }
    if (!description) {
      return res.status(400).json({ message: "Description required." });
    }
    if (!taxRate) {
      return res.status(400).json({ message: "Tax Rate required." });
    }
    if (!country) {
      return res.status(400).json({ message: "Country required." });
    }
    if (!postcode) {
      return res.status(400).json({ message: "Postcode required." });
    }
    // Create a new tax class
    const newTaxClass = new taxClassesModel({
      vendorId,
      type,
      name,
      postcode,
      country,
      taxRate,
      description,
      defaultStatus,
    });

    // Save the tax class to the database
    const savedTaxClass = await newTaxClass.save();

    res.status(201).json({
      success: true,
      message: "Tax class added successfully",
      taxClass: savedTaxClass,
    });
  } catch (error) {
    console.error("Error adding tax class:", error);
    res.status(500).json({ message: "Error adding tax class", error });
  }
};

const getAllTaxList = async (req, res) => {
  try {
    const { _id: vendorId } = req.user; // Assume vendorId is retrieved from authenticated user
    const { page = 1, limit = 10, search = "" } = req.query; // Default to page 1, limit 10, empty search string

    // Check for required fields
    if (!vendorId) {
      return res.status(400).json({ message: "Vendor ID is required." });
    }

    // Convert query params to integers
    const pageNumber = parseInt(page, 10);
    const pageSize = parseInt(limit, 10);
    const skip = (pageNumber - 1) * pageSize;

    // Create a search filter
    const searchFilter = search
      ? {
          $or: [
            { name: { $regex: search, $options: "i" } }, // Case-insensitive search by name
            { description: { $regex: search, $options: "i" } }, // Case-insensitive search by description
          ],
        }
      : {};

    // Fetch tax classes with pagination and search filter
    const taxClasses = await taxClassesModel
      .find({ vendorId, ...searchFilter })
      .skip(skip)
      .limit(pageSize)
      .sort({ createdAt: -1 }); // Sort by created date in descending order

    // Count total records for pagination
    const totalRecords = await taxClassesModel.countDocuments({
      vendorId,
      ...searchFilter,
    });

    res.status(200).json({
      success: true,
      data: taxClasses,
      totalRecords,
      currentPage: pageNumber,
      totalPages: Math.ceil(totalRecords / pageSize),
    });
  } catch (error) {
    console.error("Error retrieving tax classes:", error);
    res.status(500).json({ message: "Error retrieving tax classes", error });
  }
};

const getAlTaxClasslProducts = async (req, res) => {
  try {
    const { _id: vendorId } = req.user;

    // Check for required fields
    if (!vendorId) {
      return res.status(400).json({ message: "Vendor ID is required." });
    }

    const filter = {
      vendorId,
      type: "product",
      defaultStatus: true,
    };

    // Fetch all tax classes with the filter
    const taxClasses = await taxClassesModel
      .find(filter)
      .sort({ createdAt: -1 }); // Sort by created date in descending order

    // Count total records for the filter
    const totalRecords = await taxClassesModel.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: taxClasses,
      totalRecords,
    });
  } catch (error) {
    console.error("Error retrieving tax classes:", error);
    res.status(500).json({ message: "Error retrieving tax classes", error });
  }
};
const getAlTaxClasslAccount = async (req, res) => {
  try {
    const { _id: vendorId } = req.user;

    // Check for required fields
    if (!vendorId) {
      return res.status(400).json({ message: "Vendor ID is required." });
    }

    const filter = {
      vendorId,
      type: "account",
      defaultStatus: true,
    };

    // Fetch all tax classes with the filter
    const taxClasses = await taxClassesModel
      .find(filter)
      .sort({ createdAt: -1 }); // Sort by created date in descending order

    // Count total records for the filter
    const totalRecords = await taxClassesModel.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: taxClasses,
      totalRecords,
    });
  } catch (error) {
    console.error("Error retrieving tax classes:", error);
    res.status(500).json({ message: "Error retrieving tax classes", error });
  }
};

const updateTaxClass = async (req, res) => {
  try {
    const { _id: vendorId } = req.user;
    const { id } = req.params;
    const {
      name,
      description,
      defaultStatus,
      type,
      postcode,
      country,
      taxRate,
    } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Name is required." });
    }
    if (!description) {
      return res.status(400).json({ message: "Description is required." });
    }

    const updatedTaxClass = await taxClassesModel.findOneAndUpdate(
      { _id: id, vendorId },
      { name, description, defaultStatus, type, postcode, country, taxRate },
      { new: true, runValidators: true }
    );

    if (!updatedTaxClass) {
      return res.status(404).json({ message: "Tax class not found." });
    }

    res.status(200).json({
      success: true,
      message: "Tax class updated successfully.",
      taxClass: updatedTaxClass,
    });
  } catch (error) {
    console.error("Error updating tax class:", error);
    res.status(500).json({ message: "Error updating tax class", error });
  }
};

const getTaxClass = async (req, res) => {
  try {
    const { _id: vendorId } = req.user;
    const { id } = req.params;

    const taxClass = await taxClassesModel.findOne({
      _id: id,
      vendorId,
    });

    // If tax class not found
    if (!taxClass) {
      return res.status(404).json({ message: "Tax class not found." });
    }

    // Return the found tax class
    res.status(200).json({
      success: true,
      message: "Tax class retrieved successfully.",
      taxClass,
    });
  } catch (error) {
    console.error("Error retrieving tax class:", error);
    res.status(500).json({ message: "Error retrieving tax class", error });
  }
};

const deleteTaxClass = async (req, res) => {
  try {
    const { _id: vendorId } = req.user;
    const { id } = req.params;

    const taxClassExist = await Product.findOne({
      taxClass: id,
    });

    if (taxClassExist) {
      return res.status(400).json({
        success: false,
        message: "Tax class in use, cannot delete.",
      });
    }

    const deletedTaxClass = await taxClassesModel.findOneAndDelete({
      _id: id,
      vendorId,
    });

    if (!deletedTaxClass) {
      return res.status(404).json({ message: "Tax class not found." });
    }

    res.status(200).json({
      success: true,
      message: "Tax class deleted successfully.",
    });
  } catch (error) {
    console.error("Error deleting tax class:", error);
    res.status(500).json({ message: "Error deleting tax class", error });
  }
};

module.exports = {
  addTaxClass,
  getAllTaxList,
  getTaxClass,
  updateTaxClass,
  deleteTaxClass,
  getAlTaxClasslProducts,
  getAlTaxClasslAccount,
};
