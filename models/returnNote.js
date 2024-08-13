const mongoose = require("mongoose");

const itemsSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    quantity: { type: Number, default: 1 },
    rate: { type: String },
    price: { type: Number },
    status: { type: String },
    priceType: {
      type: String,
      enum: ["daily", "monthly", "weekly-5", "weekly-7", "weekly-minimum"],
    },
  },
  { timestamps: true }
);

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

    products: { type: [itemsSchema], default: [] },

    refrence: { type: String },
    returnDate: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const ReturnNote = mongoose.model("ReturnNote", ReturnNoteSchema);

module.exports = ReturnNote;
