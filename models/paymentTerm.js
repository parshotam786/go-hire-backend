const mongoose = require("mongoose");

const PaymentTerm = new mongoose.Schema(
  {
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      required: true,
      ref: "Vender",
    },
    name: { type: String, required: true },
    code: { type: Number, required: true, unique: true },
    description: { type: String },
    periodType: { type: String, required: true },
    days: { type: Number, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PaymentTerm", PaymentTerm);
