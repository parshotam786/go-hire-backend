const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const venderModel = require("../models/venderModel");
const subVendorSchema = require("../models/subVendorSchema");
const bcrypt = require("bcryptjs");
// Function to generate random password
// const generatePassword = () => crypto.randomBytes(8).toString("hex");

// Create Editor or Operator
exports.createEditorOrOperator = async (req, res) => {
  try {
    const { name, email, role, password, isActive } = req.body;
    const vendorId = req.user._id; // Assuming vendor is logged in
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    // Validate role
    if (!["Editor", "Operator"].includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid role" });
    }

    // Check if email already exists
    const existingUser = await venderModel.findOne({ email });
    const VendorData = await venderModel.findOne({ _id: vendorId });
    console.log(VendorData.status);
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "Email already in use" });
    }

    // Generate random password

    // Create user
    const newUser = await venderModel.create({
      legalName: name,
      email,
      password: hashedPassword,
      role,
      status: VendorData.status,
      vendor: vendorId,
      accountStatus: isActive,
    });

    // Generate JWT token
    const token = jwt.sign(
      { _id: newUser._id, role: newUser.role },
      "your_jwt_secret",
      { expiresIn: "7d" }
    );

    // Save token and update vendor's subAccounts
    newUser.token = token;
    await newUser.save();

    // const vendor = await venderModel.findById(vendorId);
    // vendor.subAccounts.push(newUser._id);
    // await vendor.save();

    // Send email with credentials
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "parshotamrughanii@gmail.com",
        pass: "walz hskf huzy yljv",
      },
    });

    await transporter.sendMail({
      from: "parshotamrughanii@gmail.com",
      to: email,
      subject: "Account Created",
      text: `Your account has been created:
      Email: ${email}
      Password: ${password}
      Role: ${role}
      Login URL: https://gohire-frontend-eqqmb.ondigitalocean.app/`,
    });

    res.status(201).json({
      success: true,
      message: "User created successfully!",
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", details: error.message });
  }
};

// Get all Editors or Operators with pagination and search
exports.getAllSubVendor = async (req, res) => {
  try {
    const vendorId = req.user._id;
    const { page = 1, limit = 10, search = "" } = req.query;

    const skip = (page - 1) * limit;

    const query = {
      vendorId,
      role: { $in: ["Editor", "Operator"] },
      $or: [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ],
    };

    const total = await subVendorSchema.countDocuments(query);
    const users = await subVendorSchema
      .find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .select(["-password", "-token"])
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Server error", details: error.message });
  }
};

exports.updateSubVendorStatus = async (req, res) => {
  const vendorId = req.user._id;
  const { id, accountStatus } = req.body;

  try {
    const SubVendor = await subVendorSchema.findById({ vendorId, _id: id });

    if (!SubVendor) {
      return res
        .status(404)
        .send({ success: false, message: "Account not found" });
    }

    SubVendor.accountStatus = accountStatus;

    const updatedSubVendor = await SubVendor.save();

    res.status(200).json({
      success: true,
      message: "Status change successfully!",
      updatedSubVendor,
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
