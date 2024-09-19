const mongoose = require("mongoose");

const VenderSchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      required: true,
    },
    legalName: {
      type: String,
      required: true,
    },
    businessType: {
      type: String,
      required: true,
    },
    taxId: {
      type: String,
      required: true,
    },
    primaryContact: {
      type: String,
      required: true,
    },
    primaryPhone: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    street: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    zip: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      required: true,
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
      required: true,
    },
    signature: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
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
    },

    isQuickBook: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      default: "inactive",
    },
    rating: {
      type: Number,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Vender", VenderSchema);
