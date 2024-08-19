const { Schema } = require("mongoose");

const itemsSchema = new Schema(
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

export default itemsSchema;
