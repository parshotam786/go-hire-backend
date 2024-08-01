// models/YourModel.js
const mongoose = require("mongoose");

const Documents = new mongoose.Schema(
  {
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      required: true,
      ref: "Vender",
    },
    name: {
      type: String,
      required: true,
      enum: ["Order", "Batch Number"],
      unique: true,
    },
    code: {
      type: String,
      required: true,
    },
    mask: {
      type: String,
      required: true,
    },
    seed: {
      type: Number,
      required: true,
    },
    identityMinimumLength: {
      type: Number,
      required: true,
    },
    domain: {
      type: String,
      required: true,
    },
    resetSeedFlag: {
      type: Boolean,
      required: true,
      default: false,
    },
    counter: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Documents", Documents);
