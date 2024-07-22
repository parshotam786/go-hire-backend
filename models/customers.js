const mongoose = require("mongoose");

const CustomersSchema = new mongoose.Schema({
  name: {
    type: String,
  },
  thumbnail: {
    type: String,
    default: "/images/default-image.png",
  },
  number: {
    type: String,
  },
  owner: {
    type: String,

    unique: true,
  },
  stop: {
    type: Boolean,
    default: false,
  },
  active: {
    type: Boolean,
    default: false,
  },
  cashCustomer: {
    type: Boolean,
    default: false,
  },
  canTakePayments: {
    type: Boolean,
    default: false,
  },
  addressLine1: {
    type: String,
  },
  addressLine2: {
    type: String,
  },
  city: {
    type: String,
  },
  country: {
    type: String,
  },
  postCode: {
    type: String,
  },
  email: {
    type: String,
  },
  fax: {
    type: String,
  },
  telephone: {
    type: String,
  },
  website: {
    type: String,
  },
  type: {
    type: String,
  },
  industry: {
    type: String,
  },
  status: {
    type: String,
  },
  taxClass: {
    type: String,
  },
  parentAccount: {
    type: String,
  },
  invoiceRunCode: {
    type: String,
  },
  paymentTerm: {
    type: String,
  },
  vendorId: {
    type: String,
  },
});

const Category = mongoose.model("Customers", CustomersSchema);

module.exports = Category;