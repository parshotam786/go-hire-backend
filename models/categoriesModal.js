const mongoose = require("mongoose");

const CategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    default: null,
  },
});

const Category = mongoose.model("Category", CategorySchema);

// Insert custom data

// const categories = [
//   { name: "Vehicles & Parts", parentId: null },
//   { name: "Home & Garden", parentId: null },
//   { name: "Electronics", parentId: null },
//   { name: "Sporting Goods", parentId: null },
//   { name: "Health & Beauty", parentId: null },
//   { name: "Clothing & Accessories", parentId: null },
//   { name: "Business & Industrial", parentId: null },
//   { name: "Media", parentId: null },
//   { name: "Travel & Experiences", parentId: null },
//   { name: "Tools & Improvement", parentId: null },
//   { name: "Toys & Games", parentId: null },
//   { name: "Pet Supplies", parentId: null },
//   { name: "Event & Party Supplies", parentId: null },
//   { name: "Construction Equipment", parentId: null },
//   { name: "Office Equipment", parentId: null },
//   { name: "Specialty Vehicles", parentId: null },
//   { name: "Entertainment Equipment", parentId: null },
//   { name: "Medical & Care Supplies", parentId: null },
//   { name: "Agricultural Equipment", parentId: null },
//   { name: "Cleaning Equipment", parentId: null },
// ];

// Category.insertMany(categories);

module.exports = Category;
