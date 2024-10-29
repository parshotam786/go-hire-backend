const mongoose = require("mongoose");

const InvoiceBatches = new mongoose.Schema(
  {
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      required: true,
      ref: "Vender",
    },
    name: { type: String, required: true },
    description: { type: String },
    batchDate: { type: Date, required: true },
    invoiceStartDate: { type: Date, required: true },
    invoiceUptoDate: { type: Date, required: true },
    batchNumber: {
      type: String,
    },
    orders: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
        required: true,
      },
    ],
    totalInvoice: {
      type: Number,
    },
    totalPrice: {
      type: Number,
    },
    excludingTax: {
      type: Number,
    },
    tax: {
      type: Number,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("InvoiceBatches", InvoiceBatches);
