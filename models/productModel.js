const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  productName: { type: String, required: true },
  companyProductName: { type: String, required: true },
  productDescription: { type: String, required: true },
  category: { type: String, required: true },
  status: { type: String, required: true },
  // stockType: { type: String, required: true },
  // productPrice: { type: String, required: true },
  // additionalInfo: { type: String, required: true },
  rentPrice: { type: String },
  rentDuration: { type: String },
  subCategory: { type: String },
  salePrice: { type: String },
  minStock: { type: String, required: true },
  maxStock: { type: String, required: true },
  vendorId: { type: String, required: true },
  images: [{ type: String, required: true }],
  isActive: { type: String, default: "Active" },
});

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
