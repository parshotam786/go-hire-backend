const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const venderModel = require("../models/venderModel");
const subVendorSchema = require("../models/subVendorSchema");
const bcrypt = require("bcryptjs");
const roles = require("../models/roles");

exports.createEditorOrOperator = async (req, res) => {
  try {
    const { name, email, permissions, role, password, isActive } = req.body;
    const vendorId = req.user._id;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const roleExist = (await roles.find()).map((item) => item.name);
    if (!roleExist.includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid role" });
    }

    const existingUser = await venderModel.findOne({ email });
    const VendorData = await venderModel.findOne({ _id: vendorId });
    console.log(VendorData.status);
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "Email already in use" });
    }

    const newUser = await venderModel.create({
      legalName: name,
      email,
      password: hashedPassword,
      permissions,
      role,
      status: VendorData.status,
      vendor: vendorId,
      accountStatus: isActive,
    });

    const token = jwt.sign(
      { _id: newUser._id, role: newUser.role },
      "your_jwt_secret",
      { expiresIn: "7d" }
    );

    newUser.token = token;
    await newUser.save();

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
exports.getUserProfile = async (req, res) => {
  try {
    const vendorId = req.user._id;
    const userId = req.params.id;

    const user = await venderModel
      .findById({ vendor: vendorId, _id: userId })
      .select("-password -token");

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      message: "User profile retrieved successfully",
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      details: error.message,
    });
  }
};

exports.updateUserRolesAndPermissions = async (req, res) => {
  try {
    const userId = req.params.id;
    const vendorId = req.user._id;
    const { permissions, role, isActive } = req.body;

    // Check if user exists
    const user = await venderModel.findById({ vendor: vendorId, _id: userId });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (permissions) user.permissions = permissions;
    if (role) user.role = role;
    if (typeof isActive !== "undefined") user.accountStatus = isActive;

    const updatedUser = await user.save();

    res.status(200).json({
      success: true,
      message: "User Role & Permissions updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    // Handle server errors
    res.status(500).json({
      success: false,
      message: "Server error",
      details: error.message,
    });
  }
};

// Get all Editors or Operators with pagination and search
exports.getAllSubVendor = async (req, res) => {
  try {
    const vendorId = req.user._id;
    const { page = 1, limit = 10, search = "" } = req.query;
    const roleExist = (await roles.find()).map((item) => item.name);
    const skip = (page - 1) * limit;

    const query = {
      vendor: vendorId,
      role: { $in: roleExist },
      $or: [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ],
    };

    const total = await venderModel.countDocuments(query);
    const users = await venderModel
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
    const SubVendor = await venderModel.findById({ vendor: vendorId, _id: id });

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
