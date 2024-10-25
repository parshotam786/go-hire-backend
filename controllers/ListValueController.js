const express = require("express");

const Product = require("../models/productModel");
const ListValue = require("../models/listOfValues");

// Get all categories
const getAllValueList = async (req, res) => {
  const { _id: vendorId } = req.user;
  try {
    const categories = await ListValue.find({
      vendorId: vendorId,
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
    const categories = await ListValue.find({
      isActive: true,
      parentId: parentId,
    });

    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

//catogries pagination
const getAllValueOfList = async (req, res) => {
  const { _id: vendorId } = req.user;
  try {
    const { parentId, name, page = 1, limit = 10 } = req.query;

    const filter = {
      vendorId: vendorId,
      parentId: parentId || null,
    };

    if (name) {
      filter.name = { $regex: name, $options: "i" };
    }

    const categories = await ListValue.find(filter)
      .sort("name")
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await ListValue.countDocuments(filter);

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
const getAllSubNameList = async (req, res) => {
  const { _id: vendorId } = req.user;
  try {
    const { parentId, name, page = 1, limit = 10 } = req.query;

    const filter = {
      vendorId: vendorId,
      parentId: parentId || null,
    };

    if (name) {
      filter.name = { $regex: name, $options: "i" };
    }

    const categories = await ListValue.find(filter)
      .sort("name")
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const parentCategory = await ListValue.findOne({ _id: parentId });
    const mainCategory = parentCategory.name;

    const total = await ListValue.countDocuments(filter);

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

const addValueOfList = async (req, res) => {
  const { _id: vendorId } = req.user;
  const category = new ListValue({
    vendorId: vendorId,
    name: req.body.name,
    parentId: req.body.parentId || null,
  });

  try {
    const { name } = req.body;
    if (name === "") {
      return res.status(400).send({ message: "Enter the name" });
    }
    // const existingCategory = await ListValue.findOne({ name, vendorId });
    // if (existingCategory) {
    //   return res.status(400).send({ message: "Value already exists" });
    // }
    const newCategory = await category.save();
    res.status(201).json({
      success: true,
      message: "Value added successfully!",
      newCategory,
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const updateValueListStatus = async (req, res) => {
  const { id, isActive } = req.body;

  try {
    const category = await ListValue.findById(id);

    if (!category) {
      return res
        .status(404)
        .send({ success: false, message: "List Values not found" });
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

const updateListValue = async (req, res) => {
  const { id, name } = req.body;

  try {
    const category = await ListValue.findById(id);
    if (name === "") {
      return res
        .status(404)
        .send({ success: false, message: "Name field Empty!" });
    }

    if (!category) {
      return res
        .status(404)
        .send({ success: false, message: "List Values not found" });
    }

    category.name = name;

    const updatedCategory = await category.save();

    res.status(200).json({
      success: true,
      updatedCategory,
      message: "List Value update sccessfully!",
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const removeValueListController = async (req, res) => {
  const { _id: vendorId } = req.user;
  try {
    const categoryId = req.params.id;
    const productExists = await Product.findOne({
      category: categoryId,
    });

    if (productExists) {
      return res.status(400).json({
        success: false,
        message: "List Values in use, cannot delete.",
      });
    }

    const result = await ListValue.findByIdAndDelete(categoryId);

    if (!result) {
      return res.status(404).json({ message: "List Values not found" });
    }

    res
      .status(200)
      .json({ success: true, message: "List Values removed successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getAllValueList,
  getAllValueOfList,
  addValueOfList,
  getAllSubCategory,
  updateValueListStatus,
  removeValueListController,
  updateListValue,
  getAllSubNameList,
};
