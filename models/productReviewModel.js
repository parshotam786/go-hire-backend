const { Schema, model, SchemaTypes } = require("mongoose");

const ProductReviewSchema = new Schema(
  {
    title: {
      type: SchemaTypes.String,
      required: true,
      trim: true,
    },
    description: {
      type: SchemaTypes.String,
      required: true,
      trim: true,
    },
    rating: {
      type: SchemaTypes.Number,
      default: 1,
      min: 1,
      max: 5,
    },
    product_id: {
      type: SchemaTypes.ObjectId,
      ref: "Product",
      required: true,
    },
    user_id: {
      type: SchemaTypes.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = model("ProductReview", ProductReviewSchema);
