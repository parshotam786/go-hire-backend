const express = require("express");
const Category = require("../models/categoriesModal");

// Get all categories
const getAllCategory = async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get subcategories of a specific category
const categoriesByID = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id).populate(
      "subcategories"
    );
    if (!category)
      return res.status(404).json({ message: "Category not found" });
    res.json(category);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Add a new category
const addCategory = async (req, res) => {
  const category = new Category({
    name: req.body.name,
  });

  try {
    const { name } = req.body;
    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      return res.status(400).send({ message: "Category already exists" });
    }
    const newCategory = await category.save();
    res.status(201).json(newCategory);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Add subcategories to a category
const subCategoryData = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category)
      return res.status(404).json({ message: "Category not found" });

    const subcategories = await Category.insertMany(
      req.body.subcategories.map((name) => ({ name }))
    );
    category.subcategories.push(...subcategories.map((sub) => sub._id));
    await category.save();

    res.status(201).json(subcategories);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

module.exports = {
  getAllCategory,
  categoriesByID,
  addCategory,
  subCategoryData,
};
