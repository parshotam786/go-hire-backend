const Admin = require("../models/adminModel");
const Vender = require("../models/venderModel");
const Customer = require("../models/customers");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { upload, uploadLogo } = require("../utiles/multerConfig");
const nodemailer = require("nodemailer");
const Order = require("../models/orderModel");
const Product = require("../models/productModel");
const Documents = require("../models/documentNumber");
const { errorResponse, successResponse } = require("../utiles/responses");
const { default: mongoose } = require("mongoose");
const ListValue = require("../models/listOfValues");
const roles = require("../models/roles");

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
      // bankName,
      // bankAddress,
      // accountName,
      // accountNumber,
      // swiftCode,
      // iban,
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
      // bankName,
      // bankAddress,
      // accountName,
      // accountNumber,
      // swiftCode,
      // iban,
      declaration,
      signature,
      name,
      password: hashedPassword,
    });

    const vendor = await newVender.save();
    const vendorId = new mongoose.Types.ObjectId(vendor._id);

    const documents = [
      {
        vendorId: vendorId,
        name: "Order",
        code: "Ord",
        mask: "Depot",
        seed: 1,
        identityMinimumLength: 2,
        domain: "Depot",
        resetSeedFlag: false,
      },
      {
        vendorId: vendorId,
        name: "Invoice",
        code: "INV",
        mask: "country",
        seed: 1,
        identityMinimumLength: 2,
        domain: "country",
        resetSeedFlag: false,
      },
      {
        vendorId: vendorId,
        name: "Batch Number",
        code: "BN",
        mask: "country",
        seed: 1,
        identityMinimumLength: 2,
        domain: "country",
        resetSeedFlag: false,
      },
      {
        vendorId: vendorId,
        name: "Credit Note",
        code: "CN",
        mask: "country",
        seed: 1,
        identityMinimumLength: 2,
        domain: "country",
        resetSeedFlag: false,
      },
      {
        vendorId: vendorId,
        name: "Delivery Note",
        code: "DN",
        mask: "country",
        seed: 1,
        identityMinimumLength: 2,
        domain: "country",
        resetSeedFlag: false,
      },
      {
        vendorId: vendorId,
        name: "Picking List",
        code: "PL",
        mask: "country",
        seed: 1,
        identityMinimumLength: 2,
        domain: "country",
        resetSeedFlag: false,
      },
      {
        vendorId: vendorId,
        name: "Purchase Order",
        code: "PO",
        mask: "country",
        seed: 1,
        identityMinimumLength: 2,
        domain: "country",
        resetSeedFlag: false,
      },
      {
        vendorId: vendorId,
        name: "Return Note",
        code: "RN",
        mask: "country",
        seed: 1,
        identityMinimumLength: 2,
        domain: "country",
        resetSeedFlag: false,
      },
      {
        vendorId: vendorId,
        name: "Works Order",
        code: "WO",
        mask: "country",
        seed: 1,
        identityMinimumLength: 2,
        domain: "country",
        resetSeedFlag: false,
      },
    ];
    await Documents.insertMany(documents);

    const listValue = [
      {
        vendorId: vendorId,
        name: "Payment Term Period Type",
        parentId: null,
        isActive: true,
      },
      {
        vendorId: vendorId,
        name: "Contact Type",
        parentId: null,
        isActive: true,
      },
      {
        vendorId: vendorId,
        name: "Invoice Status",
        parentId: null,
        isActive: true,
      },
      {
        vendorId: vendorId,
        name: "Payment Method Type",
        parentId: null,
        isActive: true,
      },
    ];
    await ListValue.insertMany(listValue);
    res
      .status(201)
      .send({ success: true, message: "Vender registered successfully" });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// verify email
const emailVerifyController = async (req, res) => {
  try {
    const { email } = req.body;

    // Check if email is provided
    if (!email) {
      return res
        .status(400)
        .send({ success: false, message: "Email is required" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res
        .status(400)
        .send({ success: false, message: "Invalid email format" });
    }

    const existingVendor = await Vender.findOne({ email });

    if (existingVendor) {
      return res
        .status(409)
        .send({ success: false, message: "Email already exists" });
    }

    return res
      .status(200)
      .send({ success: true, message: "Email is available" });
  } catch (err) {
    return res.status(500).send({ success: false, message: err.message });
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
    if (!vender.accountStatus) {
      return res
        .status(400)
        .send({ success: false, message: "Your account has been disabled!" });
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
        // _id: vender.vendor === null ? vender.id : vender.vendor,

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
        permissions: vender.permissions,
        iban: vender.iban,
        declaration: vender.declaration,
        profile_Picture: vender.profile_Picture,
        signature: vender.signature,
        role: vender.role,
        status: vender.status,
      },
      role: vender.role,
      status: vender.status,
      permissions: vender.permissions,
    });
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
};
// const VenderLogin = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     console.log("Request body:", { email, password });

//     // Check if email matches a vendor
//     let vender = await Vender.findOne({ email });

//     // If not found as a vendor, search in subAccounts
//     let subAccount = null;
//     if (!vender) {
//       let venderaa = await Vender.find().populate("subAccounts");
//       if (venderaa) {
//         subAccount = venderaa
//           .flatMap((vendor) => vendor.subAccounts)
//           .find((sub) => sub.email === email);
//         console.log("SubAccount found:", subAccount);
//       }
//     }
//     let s = subAccount.email;
//     console.log({ subAccount, vender, s });
//     // If neither vendor nor subAccount found
//     // if (!vender || (subAccount && !subAccount.email)) {
//     //   return res.status(400).send({ message: "Invalid email or password" });
//     // }

//     // Determine which account to authenticate
//     const accountToAuthenticate = subAccount || vender;

//     // Check if the account exists
//     if (!accountToAuthenticate) {
//       return res.status(400).send({ message: "Invalid email or password" });
//     }

//     console.log("Account to authenticate:", accountToAuthenticate);

//     const isMatch = await bcrypt.compare(
//       password,
//       accountToAuthenticate.password
//     );
//     if (!isMatch) {
//       return res.status(400).send({ message: "Invalid email or password" });
//     }
//     const id = accountToAuthenticate._id;
//     const role = accountToAuthenticate.role;
//     console.log({ id });
//     const token = jwt.sign(
//       {
//         _id: id,
//         role: role,
//       },
//       "your_jwt_secret",
//       { expiresIn: "30d" }
//     );

//     // Build response for vendor or subAccount
//     if (!subAccount) {
//       // Vendor Response
//       res.send({
//         message: "Login successful",
//         token,
//         user: {
//           _id: vender.id,
//           name: vender.name,
//           email: vender.email,
//           companyName: vender.companyName,
//           legalName: vender.legalName,
//           businessType: vender.businessType,
//           taxId: vender.taxId,
//           primaryContact: vender.primaryContact,
//           primaryPhone: vender.primaryPhone,
//           street: vender.street,
//           city: vender.city,
//           state: vender.state,
//           zip: vender.zip,
//           country: vender.country,
//           bankName: vender.bankName,
//           bankAddress: vender.bankAddress,
//           accountName: vender.accountName,
//           accountNumber: vender.accountNumber,
//           swiftCode: vender.swiftCode,
//           iban: vender.iban,
//           declaration: vender.declaration,
//           profile_Picture: vender.profile_Picture,
//           signature: vender.signature,
//           role: vender.role,
//           status: vender.status,
//         },
//         role: vender.role,
//         status: vender.status,
//       });
//     } else {
//       // SubAccount Response
//       res.send({
//         message: "Login successful",
//         token,
//         user: {
//           _id: subAccount._id,
//           name: subAccount.name,
//           email: subAccount.email,
//           role: subAccount.role,
//           parentVendorId: vender._id,
//           parentVendorName: vender.companyName,
//         },
//         role: subAccount.role,
//       });
//     }
//   } catch (err) {
//     console.error("Error during login:", err);
//     res.status(500).send({ error: err.message });
//   }
// };
// const VenderLogin = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     console.log("Request body:", { email, password });

//     // Check if email matches a vendor
//     let vender = await Vender.findOne({ email });

//     // If not found as a vendor, search in subAccounts
//     let subAccount = null;
//     if (!vender) {
//       let venderaa = await Vender.find().populate("subAccounts");
//       if (venderaa) {
//         subAccount = venderaa
//           .flatMap((vendor) => vendor.subAccounts)
//           .find((sub) => sub.email === email);
//         console.log("SubAccount found:", subAccount);
//       }
//     }

//     // If neither vendor nor subAccount found, return an error
//     if (!vender && !subAccount) {
//       return res.status(400).send({ message: "Invalid email or password" });
//     }

//     // Determine which account to authenticate
//     const accountToAuthenticate = subAccount || vender;
//     console.log({ accountToAuthenticate });

//     // If accountToAuthenticate is null or undefined, return an error
//     if (!accountToAuthenticate) {
//       return res.status(400).send({ message: "Invalid email or password" });
//     }

//     // Check password match
//     const isMatch = await bcrypt.compare(
//       password,
//       accountToAuthenticate.password
//     );
//     if (!isMatch) {
//       return res.status(400).send({ message: "Invalid email or password" });
//     }

//     const id = accountToAuthenticate._id;
//     const role = accountToAuthenticate.role;

//     const token = jwt.sign(
//       {
//         _id: id,
//         role: role,
//       },
//       "your_jwt_secret",
//       { expiresIn: "30d" }
//     );

//     // Build response for vendor or subAccount
//     if (!subAccount) {
//       // Vendor Response
//       res.send({
//         message: "Login successful",
//         token,
//         user: {
//           _id: id,
//           name: vender.name,
//           email: vender.email,
//           companyName: vender.companyName,
//           legalName: vender.legalName,
//           businessType: vender.businessType,
//           taxId: vender.taxId,
//           primaryContact: vender.primaryContact,
//           primaryPhone: vender.primaryPhone,
//           street: vender.street,
//           city: vender.city,
//           state: vender.state,
//           zip: vender.zip,
//           country: vender.country,
//           bankName: vender.bankName,
//           bankAddress: vender.bankAddress,
//           accountName: vender.accountName,
//           accountNumber: vender.accountNumber,
//           swiftCode: vender.swiftCode,
//           iban: vender.iban,
//           declaration: vender.declaration,
//           profile_Picture: vender.profile_Picture,
//           signature: vender.signature,
//           role: vender.role,
//           status: vender.status,
//         },
//         role: vender.role,
//         status: vender.status,
//       });
//     } else {
//       // SubAccount Response
//       res.send({
//         message: "Login successful",
//         token,
//         user: {
//           _id: subAccount.venderId,
//           name: subAccount.name,
//           email: subAccount.email,
//           role: subAccount.role,
//           subAccountId: subAccount._id,
//           // parentVendorName: vender.companyName,
//         },
//         role: subAccount.role,
//       });
//     }
//   } catch (err) {
//     console.error("Error during login:", err);
//     res.status(500).send({ error: err.message });
//   }
// };

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

// brand logo
const updateBrandLogo = (req, res) => {
  uploadLogo(req, res, async (err) => {
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
        { brandLogo: req.file.path },
        { new: true }
      ).select("-__v -password");

      if (!vender) {
        return res
          .status(404)
          .json({ success: false, message: "Vendor not found" });
      }

      res.status(200).json({
        success: true,
        message: "Logo has been update successfully!",
        data: {
          user: vender,
        },
      });
    } catch (error) {
      res.status(500).json({ success: false, message: "Server Error" });
    }
  });
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
      bankName: req.body.bankName,
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

const getVendorDashboardStats = async (req, res) => {
  // const vendorId = req.user._id;
  const roleExist = (await roles.find()).map((item) => item.name);

  const vendorId = roleExist.includes(req.user?._doc?.role)
    ? req.user._doc.vendor
    : req.user._id;

  try {
    const statsData = await Vender.aggregate([
      { $match: { _id: vendorId } },
      {
        $lookup: {
          from: "orders",
          localField: "_id",
          foreignField: "vendorId",
          as: "orders",
        },
      },
      {
        $lookup: {
          from: "customers",
          localField: "_id",
          foreignField: "vendorId",
          as: "customers",
        },
      },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "vendorId",
          as: "products",
        },
      },
      {
        $lookup: {
          from: "venders",
          localField: "_id",
          foreignField: "vendor",
          as: "venders",
        },
      },
      {
        $lookup: {
          from: "returnnotes",
          localField: "_id",
          foreignField: "vendorId",
          as: "invoices",
        },
      },
      {
        $project: {
          _id: 0,
          ordersCount: { $size: "$orders" },
          productsCount: { $size: "$products" },
          customersCount: { $size: "$customers" },
          invoicesCount: { $size: "$invoices" },
          userCount: { $size: "$venders" },
        },
      },
      {
        $addFields: {
          statsData: [
            { name: "Orders", count: "$ordersCount" },
            { name: "Products", count: "$productsCount" },
            { name: "Customers", count: "$customersCount" },
            { name: "Invoices", count: "$invoicesCount" },
            { name: "User Roles", count: "$userCount" },
          ],
        },
      },
      {
        $project: {
          statsData: 1,
        },
      },
    ]);

    return successResponse(res, { data: statsData[0]?.statsData });
  } catch (error) {
    return errorResponse(res, { message: error?.message || "Server Error!" });
  }
};

//forgot passowrd
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Check if vendor exists
    const vendor = await Vender.findOne({ email });
    if (!vendor) {
      return res
        .status(404)
        .send({ success: false, message: "Vendor not found" });
    }

    // Generate a reset token (valid for 1 hour)
    const resetToken = jwt.sign(
      { _id: vendor._id },
      process.env.JWT_TOKEN_SECRET_KEY,
      {
        expiresIn: "1h",
      }
    );

    // Save the token temporarily in the database (optional: store hashed token for security)
    vendor.resetPasswordToken = resetToken;
    vendor.resetPasswordExpires = Date.now() + 3600000; // 1 hour from now
    await vendor.save();

    // Send email with reset link
    const resetLink = `${process.env.FRONTEND_URL}auth/reset-password/${resetToken}`;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.NODEMAILER_EMAIL,
        pass: process.env.NODEMAILER_PASS,
      },
    });

    // Send mail
    const mailOptions = {
      from: "parshotamrughanii@gmail.com",
      to: email,
      subject: "Password Reset Request",
      html: `<p>You requested for a password reset. Click the link below to reset your password:</p>
             <a href="${resetLink}">Reset Password</a>
             <p>This link will expire in 1 hour.</p>`,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).send({
      success: true,
      message: "Password reset link sent to your email",
    });
  } catch (err) {
    res.status(500).send({ success: false, message: err.message });
  }
};
const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    const decoded = jwt.verify(token, process.env.JWT_TOKEN_SECRET_KEY);

    const vendor = await Vender.findById(decoded._id);
    if (!vendor) {
      return res
        .status(404)
        .send({ success: false, message: "Vendor not found" });
    }
    if (newPassword === "") {
      return res
        .status(404)
        .send({ success: false, message: "Password field is Empty!" });
    }
    if (newPassword.length < 5) {
      return res
        .status(404)
        .send({ success: false, message: "Password is too short!" });
    }

    if (Date.now() > vendor.resetPasswordExpires) {
      return res.status(400).send({ success: false, message: "Token expired" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    vendor.password = hashedPassword;
    vendor.resetPasswordToken = undefined;
    vendor.resetPasswordExpires = undefined;
    await vendor.save();

    res.status(200).send({
      success: true,
      message:
        "Password reset successful. You can now log in with your new password.",
    });
  } catch (err) {
    res.status(500).send({ success: false, message: err.message });
  }
};

module.exports = {
  AdminLogin,
  AdminRegister,
  VenderRegister,
  emailVerifyController,
  VenderLogin,
  updateVenderStatus,
  AdminDirectory,
  VenderDirectory,
  UserProfile,
  updateProfilePicture,
  updateBrandLogo,
  updateUserdata,
  updateVendorStatus,
  removeVenderAccount,
  getVendorDashboardStats,
  forgotPassword,
  resetPassword,
};
