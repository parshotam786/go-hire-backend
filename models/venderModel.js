const mongoose = require("mongoose");

// const mongoose = require("mongoose");
// const bcrypt = require("bcrypt");

// const subVendorSchema = new mongoose.Schema(
//   {
//     name: { type: String, required: true },
//     email: { type: String,  unique: true },
//     password: { type: String, required: true },
//     role: {
//       type: String,
//       enum: ["Editor", "Operator"],
//       default: "Operator",
//     },
//     vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor" },
//     token: { type: String },
//     accountStatus: {
//       type: Boolean,
//       default: true,
//     },
//   },
//   { timestamps: true }
// );

// // Hash password before saving
// subVendorSchema.pre("save", async function (next) {
//   if (!this.isModified("password")) return next();
//   this.password = await bcrypt.hash(this.password, 10);
//   next();
// });

// module.exports = mongoose.model("SubVendor", subVendorSchema);

const VenderSchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
    },
    legalName: {
      type: String,
    },
    businessType: {
      type: String,
    },
    taxId: {
      type: String,
    },
    primaryContact: {
      type: String,
    },
    primaryPhone: {
      type: String,
    },
    password: {
      type: String,
    },
    email: {
      type: String,
    },
    street: {
      type: String,
    },
    city: {
      type: String,
    },
    state: {
      type: String,
    },
    zip: {
      type: String,
    },
    country: {
      type: String,
    },
    bankName: {
      type: String,
      default: "",
    },
    bankAddress: {
      type: String,
      default: "",
    },
    accountName: {
      type: String,
      default: "",
    },
    accountNumber: {
      type: String,
      default: "",
    },
    swiftCode: {
      type: String,
      default: "",
    },
    iban: {
      type: String,
      default: "",
    },
    declaration: {
      type: String,
    },
    signature: {
      type: String,
    },
    name: {
      type: String,
    },
    profile_Picture: {
      type: String,
      default: "images/default-avatar.jpg",
    },
    brandLogo: {
      type: String,
      default: "images/dummylogo.png",
    },
    role: {
      type: String,
      default: "Seller",
      enum: ["Seller", "Admin", "Editor", "Operator"],
    },

    isQuickBook: {
      type: Boolean,
      default: false,
    },
    accountStatus: {
      type: Boolean,
    },
    status: {
      type: String,
      default: "inactive",
    },
    rating: {
      type: Number,
    },
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vender",
      default: null,
    },
    // permissions:[{
    //   type:
    // }]

    // subAccounts: [
    //   {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: "SubVendor",
    //   },
    // ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Vender", VenderSchema);
