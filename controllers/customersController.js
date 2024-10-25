const multer = require("multer");
const path = require("path");
const Customer = require("../models/customers");
const Order = require("../models/orderModel");
const { errorResponse, successResponse } = require("../utiles/responses");
const { default: mongoose } = require("mongoose");
const QuickBooks = require("node-quickbooks");
const { getNextSequence } = require("../services/counterService");
const Quickbook = require("../models/quickbookAuth");
const venderModel = require("../models/venderModel");

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

    const thumbnail = req.file ? req.file.path : "images/default-image.png";
    const vendor = await venderModel.findById(vendorId);

    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    const isQuickBookAccountExist = vendor.isQuickBook;

    const customer = new Customer({
      customerID: "",
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

    // Save customer to local database

    // Check if QuickBooks integration is required
    if (isQuickBookAccountExist) {
      const existingRecord = await Quickbook.findOne({ vendorId });
      if (!existingRecord) {
        return res
          .status(404)
          .json({ message: "QuickBooks account not found" });
      }

      // Set up QuickBooks instance
      const qbo = new QuickBooks(
        process.env.CLIENT_ID,
        process.env.CLIENT_SECRET,
        existingRecord.accessToken,
        false, // No token secret for OAuth2
        existingRecord.realmId,
        true, // Use sandbox
        true, // Debug mode
        existingRecord.refreshToken,
        "2.0" // OAuth version
      );

      // Define customer data for QuickBooks
      const customerData = {
        DisplayName: name,
        GivenName: name,
        PrimaryEmailAddr: {
          Address: email,
        },
        CustomField: [
          {
            DefinitionId: 333,
            Name: 333,
            Type: "StringType",
            StringValue: "333",
          },
        ],
        BillAddr: {
          Line1: addressLine1,
          City: city,
          CountrySubDivisionCode: "PK",
          PostalCode: postCode,
          Country: country,
        },
      };

      // Create customer in QuickBooks
      qbo.createCustomer(customerData, async (err, qbCustomer) => {
        if (err) {
          console.error("Error creating customer in QuickBooks:", err);
          return res.status(500).json({
            message: "Error creating customer in QuickBooks",
            error: err,
          });
        } else {
          try {
            customer.customerID = qbCustomer.Id;
            await customer.save();

            return res.status(201).json({
              message: "Customer created successfully in QuickBooks",
              success: true,
              customer,
            });
          } catch (saveError) {
            console.error("Error saving customer data:", saveError);
            return res.status(500).json({
              message: "Error saving customer data",
              error: saveError,
            });
          }
        }
      });

      // Stop further processing if QuickBooks error occurs
      return; // Ensure this prevents further execution
    }

    // Save customer to local database without QuickBooks integration
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
      .limit(parseInt(limit))
      .populate(["invoiceRunCode", "paymentTerm"]);

    const totalCustomers = await Customer.countDocuments(query);

    const customersWithNames = customers.map((customer) => ({
      ...customer._doc,
      name: { name: customer.name, id: customer._id },
    }));

    res.status(200).json({
      message: "Customers retrieved successfully",
      success: true,
      customers: customersWithNames,
      totalPages: Math.ceil(totalCustomers / limit),
      currentPage: parseInt(page),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = {
      name: req.body.name,
      number: req.body.number,
      vendorId: req.body.vendorId,
      owner: req.body.owner,
      stop: req.body.stop,
      active: req.body.active,
      cashCustomer: req.body.cashCustomer,
      canTakePayments: req.body.canTakePayments,
      addressLine1: req.body.addressLine1,
      addressLine2: req.body.addressLine2,
      city: req.body.city,
      country: req.body.country,
      postCode: req.body.postCode,
      email: req.body.email,
      fax: req.body.fax,
      telephone: req.body.telephone,
      website: req.body.website,
      type: req.body.type,
      industry: req.body.industry,
      status: req.body.status,
      taxClass: req.body.taxClass,
      parentAccount: req.body.parentAccount,
      invoiceRunCode: req.body.invoiceRunCode,
      paymentTerm: req.body.paymentTerm,
    };

    if (req.file) {
      updateData.thumbnail = req.file.path;
    }

    const customer = await Customer.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!customer) {
      return res.status(404).json({
        message: "Customer not found",
        success: false,
      });
    }

    res.status(200).json({
      message: "Customer updated successfully",
      success: true,
      customer,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const isCustomer = await Customer.findById(id);
    if (!isCustomer) {
      return errorResponse(res, { message: "Customer not found!" });
    }

    await Customer.findByIdAndDelete(id);
    await Order.deleteMany({ customerId: id });

    return successResponse(res, { message: "Customer deleted successfully." });
  } catch (error) {
    console.error(error);
    return errorResponse(res, { message: error?.message || "Server Error!" });
  }
};

const getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid customer ID",
        success: false,
      });
    }

    // const customer = await Customer.findById(id);

    // if (!customer) {
    //   return res.status(404).json({
    //     message: "Customer not found",
    //     success: false,
    //   });
    // }

    const objectId = mongoose.mongo.ObjectId.createFromHexString(id);

    const customerWithOrders = await Customer.aggregate([
      {
        $match: { _id: objectId },
      },
      {
        $lookup: {
          from: "orders",
          localField: "_id",
          foreignField: "customerId",
          as: "orders",
        },
      },
      {
        $lookup: {
          from: "delivernotes",
          localField: "_id",
          foreignField: "customerId",
          as: "delivernotes",
        },
      },
      {
        $lookup: {
          from: "returnnotes",
          localField: "_id",
          foreignField: "customerId",
          as: "returnnotes",
        },
      },
      {
        $addFields: {
          numOfOrders: { $size: "$orders" },
        },
      },
      {
        $addFields: {
          numOfRN: { $size: "$returnnotes" },
        },
      },
      {
        $addFields: {
          numOfDN: { $size: "$delivernotes" },
        },
      },
    ]);

    if (customerWithOrders.length === 0) {
      return res.status(404).json({
        message: "Customer not found",
        success: false,
      });
    }

    res.status(200).json({
      message: "Customer retrieved successfully",
      success: true,
      customer: customerWithOrders[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  addCustomer: [upload.single("thumbnail"), addCustomer],
  getCustomer,
  updateCustomer: [upload.single("thumbnail"), updateCustomer],
  deleteCustomer,
  getCustomerById,
};
