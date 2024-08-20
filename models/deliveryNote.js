const mongoose = require("mongoose");
const itemsSchema = require("./itemsSchema");

const DeliverNoteSchema = new mongoose.Schema(
  {
    deliveryNote: { type: String, required: true },
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
    bookDate: {
      type: Date,
      default: Date.now(),
    },
  },
  { timestamps: true }
);

const DeliverNote = mongoose.model("DeliverNote", DeliverNoteSchema);

module.exports = DeliverNote;
