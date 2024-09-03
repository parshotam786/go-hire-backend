const mongoose = require("mongoose");

const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 59 },
});

const Counter = mongoose.model("CounterId", counterSchema);

module.exports = Counter;
