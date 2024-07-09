const Admin = require("../models/adminModel");
const Vender = require("../models/venderModel");
const OtpVerification = require("../models/otpVerificationModel")
const User = require("../models/userModel")
const UserOtpVerification = require("../models/userOtpVerificationModal")
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const nodemailer = require('nodemailer')

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

const updateProfileAdmin = async (req, res) => {
  try {
    const { id } = req.params
    const { name } = req.body

    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
    }

    const admin = await Admin.findById(id)
    if (!admin) {
        res.status(404).json({ error: 'Admin not found!' })
    }

    admin.name =  name;
    await admin.save();

    res.status(200).json({ message: "Profile updated successfully!", admin })
  } catch (error) {
    res.status(500).send({ error: error.message })
  }
}

const updateVendorPassword = async (req, res) => {
  const { id } = req.params
  const { current_password, new_password } = req.body

  try {    
    const vender = await Vender.findById(id) // or req.user.id

    if (!vender) {
      return res.status(404).json({ error: "Vendor not found" });
    }

    const isMatch = await bcrypt.compare(current_password, vender.password)

    if (!isMatch) {
      return res.status(401).json({ error: "Invalid current password" })
    }

    const hashedPassword = await bcrypt.hash(new_password, 10);
    vender.password = hashedPassword
    await vender.save()
    return res.status(200).json({ message: "Password updated successfully!", vender })
  } catch (error) {
    return res.status(500).send({ error: error.message })
  }
}

const forgotVendorPassword = async (req, res) => {
  const { email } = req.body
  try {
    if(!email) {
      return res.status(401).json({ message: "Email is required" })
    }

    const vender = await Vender.findOne({ email })

    if (!vender) {
      return res.status(404).json({ error: "Email not found" });
    }

    const otp = Math.floor(1000 + Math.random() * 9000);
    const hashedOtp = await bcrypt.hash(otp.toString(), 10)

    // check if otp exist so update this otp (if otp already exist)
    const checkOtp = await OtpVerification.findOne({ email })

    if (checkOtp) {
      console.log("already exist otp")
      await OtpVerification.findOneAndUpdate( { email }, { otp: hashedOtp }, { upsert: true } )
      await sendOtpVerification(email, otp)
    }
    else {
      // create new otp
      console.log("new otp")
      await OtpVerification.create({
        email,
        otp: hashedOtp
      })
      await sendOtpVerification(email, otp)    
    }
    return res.status(200).json({ message: "OTP sent successfully!" })
  } catch (error) {
    return res.status(500).send({ error: error.message })
  }
}

const sendOtpVerification = async (email, otp) => {
  try {
    const transporter = nodemailer.createTransport({
      // service: 'gmail',
      // auth: {
      //   user: '',
      //   pass: ''
      // },
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
          user: 'blake.koss@ethereal.email',
          pass: 'yTThTSu3fS5hTpNcaz'
      }
    });

    const mailOptions = {
      from: 'testing@mailinator.com',
      to: email,
      subject: "Verification",
      html: `<p>Your OTP code is ${otp}<p/>`
    }
    await transporter.sendMail(mailOptions);
    console.log("OTP code sent successfully to", email, otp)
  } catch (error) {
    console.log("Error sending OTP email", error)
  }
}

const verifyOtp = async (req, res) => {
  const { email, otp } = req.body
  try {
    if (!email || !otp) {
      return res.status(400).json({ error: "All fields required!" })
    }

    const checkOtp = await OtpVerification.findOne({ email })

    if (!checkOtp) {
      return res.status(400).json({ error: "Again generate OTP!" })
    }

    // compare time
    if (checkOtp.expiresAt < new Date()) {
      await OtpVerification.deleteOne({ email })
      return res.status(400).json({ error: "OTP has expired" })
    }

    const isMatch = await bcrypt.compare(otp, checkOtp.otp)

    if (!isMatch) {
      return res.status(400).json({ error: "Invalid OTP" })
    }

    const vender = await Vender.findOne({ email })
    const token = jwt.sign(
      { id: vender._id, role: vender.role },
      "your_jwt_secret",
      { expiresIn: "1h" }
    );

    await OtpVerification.deleteOne({ email })

    return res.status(200).json({ token: token, message: "OTP verified successfully!" })
  } catch (error) {
    return res.status(500).send({ error: error.message });
  }
}

const resetPassword = async (req, res) => {
  const { new_password } = req.body
  try {
    if (!new_password) {
      return res.status(400).json({ error: "New passowrd is required" })
    }
    
    const vendor = await Vender.findById(req.user.id)

    if (!vendor) {
      return res.status(400).json({ error: "Vendor not found!" })
    }

    const hashedPassword = await bcrypt.hash(new_password, 10)
    vendor.password = hashedPassword
    await vendor.save()

    return res.status(200).json({ message: "Password reseet successfully!", vendor })
  } catch (error) {
    return res.status(500).send({ error: error.message })
  }
}

const UserRegister = async (req, res) => {
  const { name, email, password } = req.body
  try {
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ message: "User already registered" })
    }
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)
    const newUser = new User({
      name,
      email,
      password: hashedPassword
    })
    await newUser.save();
    const otp = Math.floor(1000 + Math.random() * 9000);
    const hashedOtp = await bcrypt.hash(otp.toString(), 10)

    const checkOtp = await UserOtpVerification.findOne({ email })
    if (checkOtp) {
      await UserOtpVerification.findOneAndUpdate( { email }, { otp: hashedOtp }, { upsert: true } )
    }
    else {
      await UserOtpVerification.create({
        email,
        otp: hashedOtp
      })
    }
    await sendOtpVerification(email, otp)

    return res.status(201).json({ message: "User created successfully!" })
  } catch (error) {
    return res.status(500).send({ error: error.message })
  }
}

const UserLogin = async (req, res) => {
  const { email, password } = req.body
  try {
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" })
    }
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" })
    }
    const token = jwt.sign(
      { id: user._id },
      "your_jwt_secret",
      { expiresIn: "1h" }
    );
    res.status(200).send({
      message: "Login successfull",
      user: user,
      token: token
    })
  } catch (error) {
    return res.status(500).send({ error: error.message })
  }
}

const VerifyUserOtp = async (req, res) => {
  const { otp, email } = req.body
  try {
    if (!otp || !email) {
      return res.status(400).send({ error: "All fields are required!" })
    }
    const checkOtp = await UserOtpVerification.findOne({ email })
    if (!checkOtp) {
      return res.status(400).send({ error: "Email not found!" })
    }
    if (checkOtp.expiresAt < Date.now()) {
      await UserOtpVerification.deleteOne({ email })
      return res.status(400).json({ error: "OTP has expired!" })
    }
    const isMatch = await bcrypt.compare(otp, checkOtp.otp)
    if (!isMatch) {
      return res.status(400).json({ error: "OTP did not match" })
    }
    const user = await User.findOne({ email })
    const token = jwt.sign(
      { id: user._id },
      "your_jwt_secret",
      { expiresIn: "1h" }
    );
    await UserOtpVerification.deleteOne({ email })
    res.status(200).json({
      token: token,
      message: "OTP verified successfully!"
    })
  } catch (error) {
    return res.status(500).send({ error: error.message })
  }
}

const UpdateUserPassword = async (req, res) => {
  const { id } = req.params
  const { old_password, new_password } = req.body
  try {
    const user = await User.findById(id)
    if (!user) {
      return res.status(400).json({ message: "User not found!" })
    }
    const isMatch = await bcrypt.compare(old_password, user.password)
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid current Password" })
    }
    const hashedPassword = await bcrypt.hash(new_password, 10)
    user.password = hashedPassword,
    await user.save()
    res.status(200).json({ message: "Password updated successfully!" })
  } catch (error) {
    return res.status(500).send({ error: error.message })
  }
}

const ForgotUserPassword = async (req, res) => {
  const { email } = req.body
  try {
    if (!email) {
      return res.status(400).json({ message: "Email is required" })
    }
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(400).json({ message: "User not found!" })
    }
    const otp = Math.floor(1000 + Math.random() * 9000)
    const hashedOtp = await bcrypt.hash(otp.toString(), 10)
    const checkOtp = await UserOtpVerification.findOne({ email })
    if (checkOtp) {
      await UserOtpVerification.findOneAndUpdate( { email } , { otp: hashedOtp }, { upsert: true })
    } else {
      await UserOtpVerification.create({
        email,
        otp: hashedOtp
      })
    }
    await sendOtpVerification(email, otp)
    res.status(200).json({ message: "OTP send successfully!" })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

// then verify user otp then reset user password

const ResetUserPassword = async (req, res) => {
  const { new_password } = req.body
  try {
    if (!new_password) {
      return res.status(400).json({ message: "New passowrd is required" })
    }
    const user = User.findById(req.user.id)
    if (!user) {
      return res.status(400).json({ message: "User not found!" })
    }
    const hashedPassword = await bcrypt.hash(new_password, 10)
    user.password = hashedPassword
    await user.save()
    res.status(200).json({ message: "Password reset successfully!" })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

module.exports = {
  AdminLogin,
  AdminRegister,
  VenderRegister,
  VenderLogin,
  updateVenderStatus,
  AdminDirectory,
  VenderDirectory,
  updateVendorPassword,
  forgotVendorPassword,
  verifyOtp,
  resetPassword,
  UserRegister,
  UserLogin,
  VerifyUserOtp,
  UpdateUserPassword,
  ForgotUserPassword,
  ResetUserPassword
};
