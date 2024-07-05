const Product = require("../models/productModel");

// Add Product Api
exports.addProduct = async (req, res) => {
  try {
    const {
      productName,
      companyProductName,
      productDescription,
      category,
      status,
      rentPrice,
      rentDuration,
      salePrice,
      availability,
      minStock,
      maxStock,
      subCategory,
      vendorId,
    } = req.body;

    const images = req.files.map((file) => file.path);

    const product = new Product({
      productName,
      companyProductName,
      productDescription,
      category,
      status,
      rentPrice,
      rentDuration,
      subCategory,
      salePrice,
      minStock,
      maxStock,
      vendorId,
      images,
    });

    await product.save();
    res.status(201).json({ message: "Product added successfully", product });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error adding product", details: error.message });
  }
};

// Update Product Api
exports.updateProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    const {
      productName,
      companyProductName,
      productDescription,
      category,
      status,
      rentPrice,
      rentDuration,
      salePrice,
      availability,
      minStock,
      maxStock,
      subCategory,
      vendorId,
    } = req.body;

    const existImage = await Product.findById(productId).select("images");
    let images =
      req.files && req.files.length > 0
        ? existImage.images.concat(req.files.map((file) => file.path))
        : existImage.images;

    const updateFields = {
      productName,
      companyProductName,
      productDescription,
      category,
      status,
      rentPrice,
      rentDuration,
      salePrice,
      availability,
      minStock,
      maxStock,
      subCategory,
      vendorId,
      images,
    };

    Object.keys(updateFields).forEach(
      (key) => updateFields[key] === undefined && delete updateFields[key]
    );

    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      { $set: updateFields },
      { new: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.status(200).json({
      message: "Product updated successfully",
      product: updatedProduct,
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error updating product", details: error.message });
  }
};

// Delete Product image
exports.deleteProductImage = async (req, res) => {
  const { productId } = req.params;
  const { imageUrl } = req.body;

  try {
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).send({ message: "Product not found" });
    }

    product.images = product.images.filter((img) => img !== imageUrl);
    await product.save();

    res.status(200).send({ message: "Image deleted successfully" });
  } catch (error) {
    res.status(500).send({ message: "Error deleting image", error });
  }
};

// Get All Product List
exports.ProductList = async (req, res) => {
  const products = await Product.find().populate();
  res.status(200).json({
    success: true,
    data: products,
  });
};
// Get all product list of specific user
exports.getProductsByVendorId = async (req, res) => {
  try {
    const { vendorId } = req.body;

    if (!vendorId) {
      return res.status(400).json({ error: "Vendor ID is required" });
    }

    const products = await Product.find({ vendorId }).sort({
      createdAt: -1,
    });

    const transformedProducts = products.map((product) => ({
      id: product._id,
      companyProductName: product.companyProductName,
      productDescription: product.productDescription,
      productName: product.productName,
      category: product.category,
      sub_category: product.subCategory,
      status: product.status,
      rentPrice: product.rentPrice,
      rentDuration: product.rentDuration,
      salePrice: product.salePrice,
      minStock: product.minStock,
      maxStock: product.maxStock,
      vendorId: product.vendorId,
      thumbnail: product.images[0],
      isActive: product.isActive,
      title: product.productName,
    }));

    res.status(200).json({
      success: true,
      data: transformedProducts,
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error fetching products", details: error.message });
  }
};
// Remove product from data base
exports.removeProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!productId) {
      return res.status(400).json({ message: "Product ID is required" });
    }

    const product = await Product.findByIdAndDelete(productId);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json({
      success: true,
      message: "Product removed successfully",
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error removing product", details: error.message });
  }
};

// exports.getProudctById = async (req, res) => {
//   try {
//     const id = req.params.id;
//     const products = await Product.findOne(id);
//     res.status(200).json(products);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

// Get detail product by id
exports.getProudctById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id).select("-__v");

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.status(200).json({ product });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error retrieving product", details: error.message });
  }
};
