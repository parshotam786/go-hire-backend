const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    productName: { type: String, required: true },
    companyProductName: { type: String, required: true },
    productDescription: { type: String, required: true },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Category",
    },
    status: { type: String, required: true },
    // stockType: { type: String, required: true },
    // productPrice: { type: String, required: true },
    // additionalInfo: { type: String, required: true },
    rentPrice: { type: Number },
    rentDuration: { type: String },
    subCategory: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Category",
    },
    salePrice: { type: String },
    quantity: { type: String, required: true },
    minHireTime: { type: String, required: true },
    range: { type: String },
    vat: { type: String },
    rate: { type: String },
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
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
