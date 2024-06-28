const express = require("express");
const Category = require("../models/categoriesModal");

// Get all categories
const getAllCategory = async (req, res) => {
  try {
    const categories = await Category.find({
      parentId: req.query.parentId,
    }).sort("name");
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Add a new category
const addCategory = async (req, res) => {
  const category = new Category({
    name: req.body.name,
    parentId: req.body.parentId || null,
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

module.exports = {
  getAllCategory,

  addCategory,
};
