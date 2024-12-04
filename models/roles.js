const mongoose = require("mongoose");

const RolesSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },

    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vender",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Roles", RolesSchema);
