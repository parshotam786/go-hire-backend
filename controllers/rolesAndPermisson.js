const roles = require("../models/roles");

// Add a new role
exports.addRole = async (req, res) => {
  const vendorId = req.user._id;
  const { name } = req.body;

  if (!name) {
    return res
      .status(400)
      .json({ success: false, message: "Role name is required" });
  }
  if (name.toLowerCase() === "seller") {
    return res.status(400).json({
      success: false,
      message: "You are not authorizied to assign Seller role.",
    });
  }
  if (name.toLowerCase() === "admin") {
    return res.status(400).json({
      success: false,
      message: "You are not authorizied to assign Admin role.",
    });
  }
  try {
    const existingRole = await roles.findOne({ name, vendorId });
    if (existingRole) {
      return res.status(400).json({
        success: false,
        message: "Role name already exists for this vendor",
      });
    }

    const newRole = new roles({
      name,
      vendorId,
    });

    const savedRole = await newRole.save();
    res.status(201).json({
      success: true,
      message: "Role created successfully",
      role: savedRole,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to create role",
      error: err.message,
    });
  }
};

exports.getRoleByVendorId = async (req, res) => {
  const vendorId = req.user._id;

  if (!vendorId) {
    return res.status(400).json({ success: false, message: "Role is Empty" });
  }

  try {
    const existingRole = await roles.find({ vendorId }).sort({ _id: -1 });

    res.status(201).json({
      success: true,
      message: "Role Data retrived successfully",
      data: existingRole,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to get role",
      error: err.message,
    });
  }
};
