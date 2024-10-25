const mongoose = require("mongoose");

const InvoiceRunCode = new mongoose.Schema(
  {
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      required: true,
      ref: "Vender",
    },
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    description: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("InvoiceRunCode", InvoiceRunCode);
