const Admin = require("../models/adminModel");
const Vender = require("../models/venderModel");
const Customer = require("../models/customers");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const upload = require("../utiles/multerConfig");
const Order = require("../models/orderModel");
const Product = require("../models/productModel");

// Admin registration
const AdminRegister = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).send({ error: "Email already exists" });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newAdmin = new Admin({ name, email, password: hashedPassword });
    await newAdmin.save();
    res.status(201).send({ message: "Admin registered successfully" });
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
};

// Admin login
const AdminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(400).send({ error: "Invalid email or password" });
    }
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(400).send({ error: "Invalid email or password" });
    }
    const token = jwt.sign(
      { id: admin._id, role: admin.role },
      "your_jwt_secret",
      { expiresIn: "30d" }
    );
    res.send({
      message: "Login successful",
      response: { id: admin.id, name: admin.name, email: admin.email },
      token,
      role: admin.role,
    });
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
};

// Seller registration
const VenderRegister = async (req, res) => {
  try {
    const {
      companyName,
      legalName,
      businessType,
      taxId,
      primaryContact,
      primaryPhone,
      password,
      email,
      street,
      city,
      state,
      zip,
      country,
      bankName,
      bankAddress,
      accountName,
      accountNumber,
      swiftCode,
      iban,
      declaration,
      signature,
      name,
    } = req.body;
    const existingVender = await Vender.findOne({ email });
    if (existingVender) {
      return res.status(400).send({ message: "Email already exists" });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newVender = new Vender({
      companyName,
      legalName,
      businessType,
      taxId,
      primaryContact,
      primaryPhone,
      email,
      street,
      city,
      state,
      zip,
      country,
      bankName,
      bankAddress,
      accountName,
      accountNumber,
      swiftCode,
      iban,
      declaration,
      signature,
      name,
      password: hashedPassword,
    });
    await newVender.save();
    res
      .status(201)
      .send({ success: true, message: "Vender registered successfully" });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// Vender login
const VenderLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const vender = await Vender.findOne({ email });
    if (!vender) {
      return res.status(400).send({ message: "Invalid email or password" });
    }
    const isMatch = await bcrypt.compare(password, vender.password);
    if (!isMatch) {
      return res.status(400).send({ message: "Invalid email or password" });
    }
    const token = jwt.sign(
      { _id: vender._id, role: vender.role },
      "your_jwt_secret",
      { expiresIn: "30d" }
    );
    res.send({
      message: "Login successful",
      token,
      user: {
        _id: vender.id,
        name: vender.name,
        email: vender.email,
        companyName: vender.companyName,
        legalName: vender.legalName,
        businessType: vender.businessType,
        taxId: vender.taxId,
        primaryContact: vender.primaryContact,
        primaryPhone: vender.primaryPhone,
        street: vender.street,
        city: vender.city,
        state: vender.state,
        zip: vender.zip,
        country: vender.country,
        bankName: vender.bankName,
        bankAddress: vender.bankAddress,
        accountName: vender.accountName,
        accountNumber: vender.accountName,
        swiftCode: vender.swiftCode,
        iban: vender.iban,
        declaration: vender.declaration,
        profile_Picture: vender.profile_Picture,
        signature: vender.signature,
        role: vender.role,
        status: vender.status,
      },
      role: vender.role,
      status: vender.status,
    });
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
};

// vender status update
const updateVenderStatus = async (req, res) => {
  try {
    const { venderId, status } = req.body;

    // Ensure the status is either 'approved' or 'pending'
    if (!["approved", "pending,disabled"].includes(status)) {
      return res.status(400).send({ error: "Invalid status value" });
    }

    const vender = await Vender.findById(venderId);
    if (!vender) {
      return res.status(404).send({ error: "Vendor not found" });
    }

    vender.status = status;
    await vender.save();

    res.status(200).send({
      success: false,
      message: "Vendor status updated successfully",
      vender,
    });
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
};

const AdminDirectory = async (req, res) => {
  try {
    const directory = await Admin.find().populate("email");
    res.status(200).json(directory);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};
const VenderDirectory = async (req, res) => {
  try {
    const directory = await Vender.find().populate("email");
    res.status(200).json(directory);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};

const UserProfile = async (req, res) => {
  try {
    const vender = await Vender.findById(req.params.id).select("-password");
    if (vender) {
      res.status(200).json({
        success: true,
        data: {
          user: vender,
        },
      });
    } else {
      res.status(404).json({ message: "Vendor not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateProfilePicture = (req, res) => {
  console.log("text");
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err });
    }

    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded" });
    }

    try {
      const vender = await Vender.findByIdAndUpdate(
        req.params.id,
        { profile_Picture: req.file.path },
        { new: true }
      ).select("-__v -password");

      if (!vender) {
        return res
          .status(404)
          .json({ success: false, message: "Vendor not found" });
      }

      res.status(200).json({
        success: true,
        message: "Profile has been update successfully!",
        data: {
          user: vender,
        },
      });
    } catch (error) {
      res.status(500).json({ success: false, message: "Server Error" });
    }
  });
};

const getProfilePicture = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await Vender.findById(id).select("profile_Picture");

    if (!user) {
      return res.status(404).json({ error: "Profile picture not found" });
    }

    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ error: "", details: error.message });
  }
};

const updateUserdata = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = {
      primaryContact: req.body.primaryContact,
      bankAddress: req.body.bankAddress,
      street: req.body.street,
      companyName: req.body.companyName,
      legalName: req.body.legalName,
      businessType: req.body.businessType,
      taxId: req.body.taxId,
      swiftCode: req.body.swiftCode,
      iban: req.body.iban,
      zip: req.body.zip,
      city: req.body.city,
      state: req.body.state,
      email: req.body.email,
      primaryPhone: req.body.primaryPhone,
      country: req.body.country,
      accountName: req.body.accountName,
      accountNumber: req.body.accountNumber,
    };

    const updatedVender = await Vender.findByIdAndUpdate(id, updateData, {
      new: true,
    }).select("-__v -password");

    if (!updatedVender) {
      return res.status(404).send("Vender not found");
    }

    res.status(200).json({
      success: true,
      message: "Update successful!",
      data: {
        user: updatedVender,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Invalid data!" });
  }
};

const updateVendorStatus = async (req, res) => {
  try {
    const vendorId = req.params.id;
    const { status } = req.body;

    const updatedVendor = await Vender.findByIdAndUpdate(
      vendorId,
      { status },
      { new: true }
    );

    if (!updatedVendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    res.status(200).json({
      success: true,
      message: "Your request has been sent!",
      status: updatedVendor.status,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const removeVenderAccount = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "Vendor ID is required" });
    }

    // const session = await mongoose.startSession();
    // session.startTransaction();

    try {
      const Vendor = await Vender.findById(id);

      if (!Vendor) {
        return res.status(404).json({ message: "Vendor not found" });
      }

      await Promise.all([
        Customer.deleteMany(
          { vendorId: id }
          //  { session }
        ),
        Order.deleteMany(
          { vendorId: id }
          // { session }
        ),
        Product.deleteMany(
          { vendorId: id }
          // { session }
        ),
        Vender.findByIdAndDelete(
          id
          // { session }
        ),
      ]);

      // await session.commitTransaction();
      return res.status(200).json({
        success: true,
        message: "Vendor Account Deleted successfully",
      });
    } catch (error) {
      // await session.abortTransaction();
      console.error("Error removing Vendor:", error);
      return res
        .status(500)
        .json({ error: "Error removing Vendor", details: error.message });
    } finally {
      // session.endSession();
    }
  } catch (error) {
    res.status(500).json({ error: "Unexpected error", details: error.message });
  }
};

module.exports = {
  AdminLogin,
  AdminRegister,
  VenderRegister,
  VenderLogin,
  updateVenderStatus,
  AdminDirectory,
  VenderDirectory,
  UserProfile,
  updateProfilePicture,
  getProfilePicture,
  updateUserdata,
  updateVendorStatus,
  removeVenderAccount,
};
