const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const subVendorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["Editor", "Operator"],
      default: "Operator",
    },
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor" },
    token: { type: String },
    accountStatus: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Hash password before saving
subVendorSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

module.exports = mongoose.model("SubVendor", subVendorSchema);
