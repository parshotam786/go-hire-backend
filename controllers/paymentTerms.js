const PaymentTerm = require("../models/paymentTerm");
exports.createPaymentTerm = async (req, res) => {
  try {
    const { _id: vendorId } = req.user;

    const { name, description, code, periodType, days } = req.body;
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
    if (!periodType) {
      return res.status(400).json({ message: "Period Type required." });
    }
    if (!days) {
      return res.status(400).json({ message: "Days required." });
    }

    const existingCode = await PaymentTerm.findOne({ code });
    if (existingCode) {
      return res.status(400).send({ message: "Code already exists" });
    }

    // Create a new tax class
    const paymentTerm = new PaymentTerm({
      vendorId,
      name,
      code,
      description,
      days,
      periodType,
    });
    await paymentTerm.save();
    res.status(201).json(paymentTerm);
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

exports.getAllPaymentTerms = async (req, res) => {
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

    const payment = await PaymentTerm.find({ vendorId, ...searchFilter })
      .skip(skip)
      .limit(pageSize)
      .sort({ createdAt: -1 });

    const totalRecords = await PaymentTerm.countDocuments({
      vendorId,
      ...searchFilter,
    });

    res.status(200).json({
      success: true,
      data: payment,
      totalRecords,
      currentPage: pageNumber,
      totalPages: Math.ceil(totalRecords / pageSize),
    });
  } catch (error) {
    console.error("Error retrieving payment terms:", error);
    res.status(500).json({ message: "Error retrieving payment terms", error });
  }
};

// Get a specific payment term by ID
exports.getPaymentTermById = async (req, res) => {
  try {
    const paymentTerm = await PaymentTerm.findById(req.params.id);
    if (!paymentTerm) {
      return res
        .status(404)
        .json({ success: false, message: "Payment term not found" });
    }
    res.status(200).json({
      success: true,
      message: "Data retrive successfully",
      data: paymentTerm,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update a specific payment term by ID
exports.updatePaymentTermById = async (req, res) => {
  try {
    const { _id: vendorId } = req.user;
    const updatedPaymentTerm = await PaymentTerm.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        vendorId,
      },
      { new: true, runValidators: true }
    );

    if (!updatedPaymentTerm) {
      return res.status(404).json({ message: "Payment term not found" });
    }
    res.status(200).json({
      success: true,
      message: "Payment terms update successfully",
      updatedPaymentTerm,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete a specific payment term by ID
exports.deletePaymentTermById = async (req, res) => {
  try {
    const paymentTerm = await PaymentTerm.findByIdAndDelete(req.params.id);
    if (!paymentTerm) {
      return res
        .status(404)
        .json({ success: false, message: "Payment term not found" });
    }
    res
      .status(200)
      .json({ success: true, message: "Payment term deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
