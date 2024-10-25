const mongoose = require("mongoose");

const ListValueSchema = new mongoose.Schema({
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
    required: true,
    ref: "Vender",
  },
  name: {
    type: String,
    required: true,
    // unique: true,
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ListValue",
    default: null,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
});

const ListValue = mongoose.model("ListValue", ListValueSchema);

module.exports = ListValue;
