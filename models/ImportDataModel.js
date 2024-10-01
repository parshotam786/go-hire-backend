const mongoose = require("mongoose");

const ImportData = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  template: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("ImportData", ImportData);
