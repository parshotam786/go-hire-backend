const Admin = require("../models/adminModel");
const Vender = require("../models/venderModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

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
      { expiresIn: "1h" }
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
      { id: vender._id, role: vender.role },
      "your_jwt_secret",
      { expiresIn: "1h" }
    );
    res.send({
      message: "Login successful",
      token,
      user: {
        id: vender.id,
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
        signature: vender.signature,
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

    res
      .status(200)
      .send({ message: "Vendor status updated successfully", vender });
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

module.exports = {
  AdminLogin,
  AdminRegister,
  VenderRegister,
  VenderLogin,
  updateVenderStatus,
  AdminDirectory,
  VenderDirectory,
};
