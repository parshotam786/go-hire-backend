const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    productName: { type: String, required: true },
    companyProductName: { type: String, required: true },
    productDescription: { type: String, required: true },
    category: {
      type: mongoose.Schema.Types.ObjectId,

      ref: "Category",
    },
    status: { type: String },
    // stockType: { type: String, required: true },
    // productPrice: { type: String, required: true },
    // additionalInfo: { type: String, required: true },
    rentPrice: { type: Number },
    rentDuration: { type: String },
    subCategory: {
      type: mongoose.Schema.Types.ObjectId,

      ref: "Category",
    },
    rateDefinition: {
      type: mongoose.Schema.Types.ObjectId,

      ref: "RateDefinition",
    },
    salePrice: { type: String },
    quantity: { type: Number, required: true },
    taxClass: {
      type: String,
    },
    minHireTime: { type: String },
    range: { type: String },
    vat: { type: String },
    rate: { type: String },
    lenghtUnit: { type: String },
    weightUnit: { type: String },
    weight: { type: Number },
    length: { type: Number },
    width: { type: Number },
    height: { type: Number },
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,

      ref: "Vender",
    },
    images: [{ type: String, required: true }],
    isActive: { type: String, default: "Active" },
    rating: { type: Number },
  },
  { timestamps: true }
);

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
