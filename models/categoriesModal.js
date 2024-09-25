const mongoose = require("mongoose");

const CategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    // unique: true,
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    default: null,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
});

const Category = mongoose.model("Category", CategorySchema);

module.exports = Category;
