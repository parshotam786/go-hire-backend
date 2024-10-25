const InvoiceRunCode = require("../models/invoiceRunCode");

exports.createInvoiceRunCode = async (req, res) => {
  try {
    const { _id: vendorId } = req.user;

    const { name, description, code } = req.body;
    // Check for required fields
    if (!name) {
      return res.status(400).json({ message: "Name required." });
    }
    if (!code) {
      return res.status(400).json({ message: "Code required." });
    }
    if (!description) {
      return res.status(400).json({ message: "Description required." });
    }
    const existingCode = await InvoiceRunCode.findOne({ code });
    if (existingCode) {
      return res.status(400).send({ message: "Code already exists" });
    }

    // Create a new tax class
    const invocieRun = new InvoiceRunCode({
      vendorId,
      name,
      code,
      description,
    });

    await invocieRun.save();
    res.status(201).json(invocieRun);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get all payment terms
// exports.getAllPaymentTerms = async (req, res) => {
//   try {
//     const paymentTerms = await PaymentTerm.find();
//     res.status(200).json(paymentTerms);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

exports.getAllInvoiceRunCode = async (req, res) => {
  try {
    const { _id: vendorId } = req.user;
    const { page = 1, limit = 10, search = "" } = req.query;

    if (!vendorId) {
      return res.status(400).json({ message: "Vendor ID is required." });
    }

    const pageNumber = parseInt(page, 10);
    const pageSize = parseInt(limit, 10);
    const skip = (pageNumber - 1) * pageSize;

    const searchFilter = search
      ? {
          $or: [
            { name: { $regex: search, $options: "i" } },
            { description: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    const invoice = await InvoiceRunCode.find({ vendorId, ...searchFilter })
      .skip(skip)
      .limit(pageSize)
      .sort({ createdAt: -1 });

    const totalRecords = await InvoiceRunCode.countDocuments({
      vendorId,
      ...searchFilter,
    });

    res.status(200).json({
      success: true,
      data: invoice,
      totalRecords,
      currentPage: pageNumber,
      totalPages: Math.ceil(totalRecords / pageSize),
    });
  } catch (error) {
    console.error("Error retrieving Invoice Run Code:", error);
    res
      .status(500)
      .json({ message: "Error retrieving Invoice Run Code", error });
  }
};

// Get a specific payment term by ID
exports.getInvoiceRunCodeById = async (req, res) => {
  try {
    const invoiceData = await InvoiceRunCode.findById(req.params.id);
    if (!invoiceData) {
      return res
        .status(404)
        .json({ success: false, message: "Invoice Run Code not found" });
    }
    res.status(200).json({
      success: true,
      message: "Data retrive successfully",
      data: invoiceData,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update a specific payment term by ID
exports.updateInvoiceRunCodeById = async (req, res) => {
  try {
    const { _id: vendorId } = req.user;
    const updateInvoiceRunCode = await InvoiceRunCode.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        vendorId,
      },
      { new: true, runValidators: true }
    );

    if (!updateInvoiceRunCode) {
      return res.status(404).json({ message: "Invoice Run Code not found" });
    }
    res.status(200).json({
      success: true,
      message: "Invoice Run Code update successfully",
      updateInvoiceRunCode,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete a specific payment term by ID
exports.deleteInvoiceRunCodeById = async (req, res) => {
  try {
    const invoice = await InvoiceRunCode.findByIdAndDelete(req.params.id);
    if (!invoice) {
      return res
        .status(404)
        .json({ success: false, message: "Invoice run code not found" });
    }
    res.status(200).json({
      success: true,
      message: "Invoice Run Code deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
