const mongoose = require("mongoose");

const InvoiceSchema = new mongoose.Schema(
  {
    products: [
      {
        productName: { type: String, required: true },
        companyProductName: { type: String, required: true },
        productDescription: { type: String, required: true },
        category: { type: String, required: true },
        totalRentPrice: { type: Number },
        start_date: { type: Date },
        end_date: { type: Date },
        status: { type: String },
        rentPrice: { type: Number },
        subCategory: { type: String },
        salePrice: { type: Number },
        vendorId: { type: String, required: true },
        isActive: { type: String, default: "Active" },
      },
    ],
    invoiceDate: { type: String },
    InvoiceNumber: { type: String },
    //     billing
    address: { type: String },
    city: { type: String },
    country: { type: String },
    email: { type: String },
    name: { type: String },
    phone: { type: String },
    zip: { type: String },
  },
  { timestamps: true }
);

const Invoice = mongoose.model("Invoice", InvoiceSchema);

module.exports = Invoice;
