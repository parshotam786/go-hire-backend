const express = require("express");
const Category = require("../models/categoriesModal");
const Product = require("../models/productModel");

// Get all categories
const getAllCategory = async (req, res) => {
  try {
    const categories = await Category.find({
      isActive: true,
      parentId: null,
    });

    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
const getAllSubCategory = async (req, res) => {
  try {
    const parentId = req.query.parentId;
    const categories = await Category.find({
      isActive: true,
      parentId: parentId,
    });

    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

//catogries pagination
const getAllCategoryList = async (req, res) => {
  try {
    const { parentId, name, page = 1, limit = 10 } = req.query;

    const filter = {
      parentId: parentId || null,
    };

    if (name) {
      filter.name = { $regex: name, $options: "i" };
    }

    const categories = await Category.find(filter)
      .sort("name")
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Category.countDocuments(filter);

    res.json({
      success: true,
      data: categories,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    res.status(500).json({ message: err.message, success: false });
  }
};
const getAllSubCategoryList = async (req, res) => {
  try {
    const { parentId, name, page = 1, limit = 10 } = req.query;

    const filter = {
      parentId: parentId || null,
    };

    if (name) {
      filter.name = { $regex: name, $options: "i" };
    }

    const categories = await Category.find(filter)
      .sort("name")
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const parentCategory = await Category.findOne({ _id: parentId });
    const mainCategory = parentCategory.name;

    const total = await Category.countDocuments(filter);

    res.json({
      success: true,
      data: categories,
      parent: mainCategory,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    res.status(500).json({ message: err.message, success: false });
  }
};

const addCategory = async (req, res) => {
  const category = new Category({
    name: req.body.name,
    parentId: req.body.parentId || null,
  });

  try {
    const { name } = req.body;
    if (name === "") {
      return res.status(400).send({ message: "Enter the name" });
    }
    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      return res.status(400).send({ message: "Category already exists" });
    }
    const newCategory = await category.save();
    res.status(201).json({
      success: true,
      message: "Category added successfully!",
      newCategory,
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const updateCategoryStatus = async (req, res) => {
  const { id, isActive } = req.body;

  try {
    const category = await Category.findById(id);

    if (!category) {
      return res
        .status(404)
        .send({ success: false, message: "Category not found" });
    }

    category.isActive = isActive;

    const updatedCategory = await category.save();

    res.status(200).json({
      success: true,
      message: "Status change successfully!",
      updatedCategory,
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const updateCategory = async (req, res) => {
  const { id, name } = req.body;

  try {
    const category = await Category.findById(id);
    if (name === "") {
      return res
        .status(404)
        .send({ success: false, message: "Name field Empty!" });
    }

    if (!category) {
      return res
        .status(404)
        .send({ success: false, message: "Category not found" });
    }

    category.name = name;

    const updatedCategory = await category.save();

    res.status(200).json({
      success: true,
      updatedCategory,
      message: "Category update sccessfully!",
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const removeCategoryController = async (req, res) => {
  try {
    const categoryId = req.params.id;
    const productExists = await Product.findOne({ category: categoryId });

    if (productExists) {
      return res.status(400).json({
        success: false,
        message: "Category in use, cannot delete.",
      });
    }

    const result = await Category.findByIdAndDelete(categoryId);

    if (!result) {
      return res.status(404).json({ message: "Category not found" });
    }

    res
      .status(200)
      .json({ success: true, message: "Category removed successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getAllCategory,
  getAllCategoryList,
  addCategory,
  getAllSubCategory,
  updateCategoryStatus,
  removeCategoryController,
  updateCategory,
  getAllSubCategoryList,
};
