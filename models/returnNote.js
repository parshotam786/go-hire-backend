const mongoose = require("mongoose");
const itemsSchema = require("./itemsSchema");

const ReturnNoteSchema = new mongoose.Schema(
  {
    returnNote: { type: String, required: true },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customers",
    },
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vender",
    },
    totalPrice: {
      type: Number,
      default: 0,
    },
    paymentTerms: {
      type: Number,
    },
    invoiceRunCode: {
      type: String,
    },
    products: { type: [itemsSchema], default: [] },
    collectionCharge: { type: Number },

    refrence: { type: String },
    returnDate: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

const ReturnNote = mongoose.model("ReturnNote", ReturnNoteSchema);

module.exports = ReturnNote;
