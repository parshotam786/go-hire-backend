const mongoose = require("mongoose");

const VenderSchema = new mongoose.Schema({
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
    required: true,
  },
  bankAddress: {
    type: String,
    required: true,
  },
  accountName: {
    type: String,
    required: true,
  },
  accountNumber: {
    type: String,
    required: true,
  },
  swiftCode: {
    type: String,
    required: true,
  },
  iban: {
    type: String,
    required: true,
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
  role: {
    type: String,
    default: "Seller",
  },
  status: {
    type: String,
    default: "pending",
  },
});

module.exports = mongoose.model("Vender", VenderSchema);
