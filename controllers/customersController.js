const multer = require("multer");
const path = require("path");
const Customer = require("../models/customers");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images");
  },
  filename: (req, file, cb) => {
    cb(null, "profile_" + Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 8000000 },
});

const addCustomer = async (req, res) => {
  try {
    const {
      name,
      number,
      vendorId,
      owner,
      stop,
      active,
      cashCustomer,
      canTakePayments,
      addressLine1,
      addressLine2,
      city,
      country,
      postCode,
      email,
      fax,
      telephone,
      website,
      type,
      industry,
      status,
      taxClass,
      parentAccount,
      invoiceRunCode,
      paymentTerm,
    } = req.body;

    const thumbnail = req.file ? req.file.path : "/images/default-image.png";

    const customer = new Customer({
      name,
      number,
      owner,
      stop,
      active,
      cashCustomer,
      canTakePayments,
      addressLine1,
      addressLine2,
      city,
      vendorId,
      country,
      postCode,
      email,
      fax,
      telephone,
      website,
      type,
      industry,
      status,
      taxClass,
      parentAccount,
      invoiceRunCode,
      paymentTerm,
      thumbnail,
    });

    await customer.save();
    res.status(201).json({
      message: "Customer created successfully",
      success: true,
      customer,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

const getCustomer = async (req, res) => {
  try {
    const { page = 1, limit = 10, vendorId, search } = req.query;
    const query = {};

    if (vendorId) {
      query.vendorId = vendorId;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { number: { $regex: search, $options: "i" } },
        { owner: { $regex: search, $options: "i" } },
        { city: { $regex: search, $options: "i" } },
        { country: { $regex: search, $options: "i" } },
        { postCode: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { fax: { $regex: search, $options: "i" } },
        { telephone: { $regex: search, $options: "i" } },
        { website: { $regex: search, $options: "i" } },
        { type: { $regex: search, $options: "i" } },
        { industry: { $regex: search, $options: "i" } },
        { status: { $regex: search, $options: "i" } },
        { taxClass: { $regex: search, $options: "i" } },
        { parentAccount: { $regex: search, $options: "i" } },
        { invoiceRunCode: { $regex: search, $options: "i" } },
        { paymentTerm: { $regex: search, $options: "i" } },
      ];
    }

    const customers = await Customer.find(query)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const totalCustomers = await Customer.countDocuments(query);

    res.status(200).json({
      message: "Customers retrieved successfully",
      success: true,
      customers,
      totalPages: Math.ceil(totalCustomers / limit),
      currentPage: parseInt(page),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  addCustomer: [upload.single("thumbnail"), addCustomer],
  getCustomer,
};
