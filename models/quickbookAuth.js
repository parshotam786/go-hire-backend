const mongoose = require("mongoose");

const QuickbookAuth = new mongoose.Schema({
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Vender",
  },

  realmId: {
    type: String,
  },
  accessToken: {
    type: String,
  },

  refreshToken: {
    type: String,
  },
  tokenExpiry: {
    type: String,
  },
});

module.exports = mongoose.model("Quickbook", QuickbookAuth);
