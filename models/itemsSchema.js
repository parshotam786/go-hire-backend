const { Schema } = require("mongoose");

const itemsSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product" },
    quantity: { type: Number, default: 1 },
    rate: { type: String },
    price: { type: Number },
    status: { type: String },
    // rate schema detail
    rateEngine: { type: String },
    taxRate: { type: Number, default: 0 },
    Day1: { type: String },
    Day2: { type: String },
    Day3: { type: String },
    Day4: { type: String },
    Day5: { type: String },
    Day6: { type: String },
    rentalDaysPerWeek: { type: String },
    minimumRentalPeriod: { type: String },
    priceType: {
      type: String,
      enum: ["daily", "monthly", "weekly-5", "weekly-7", "weekly-minimum"],
    },
  },
  { timestamps: true }
);

module.exports = itemsSchema;
