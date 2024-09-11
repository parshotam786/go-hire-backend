// models/YourModel.js
const mongoose = require("mongoose");

const TaxClasses = new mongoose.Schema(
  {
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      required: true,
      ref: "Vender",
    },
    type: {
      type: String,
      required: true,
      enum: ["product", "account"],
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    defaultStatus: {
      type: Boolean,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("TaxClasses", TaxClasses);
