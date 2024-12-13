const Product = require("../models/productModel");
const venderModel = require("../models/venderModel");

// Add Product Api
exports.addProduct = async (req, res) => {
  const vendorId = req.user;
  try {
    const {
      productName,
      companyProductName,
      productDescription,
      category,
      taxClass,
      status,
      rentPrice,
      rentDuration,
      salePrice,
      availability,
      rate,
      quantity,
      range,
      minHireTime,
      rateDefinition,
      vat,
      subCategory,
      lenghtUnit,
      weightUnit,
      weight,
      length,
      width,
      height,
    } = req.body;

    // Validate required fields
    if (!productName) {
      return res.status(400).json({ message: "Product name is required." });
    }
    if (!companyProductName) {
      return res
        .status(400)
        .json({ message: "Company product name is required." });
    }
    if (!productDescription) {
      return res.status(400).json({ message: "Description is required." });
    }
    if (!category) {
      return res.status(400).json({ message: "Category is required." });
    }
    if (!taxClass) {
      return res.status(400).json({ message: "Tax Class is required." });
    }
    if (!subCategory) {
      return res.status(400).json({ message: "Sub category is required." });
    }
    if (!vendorId) {
      return res.status(400).json({ message: "Vendor ID is required." });
    }
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "Images are required." });
    }

    // Collect file paths
    const images = req.files.map((file) => file.path);

    // Create a new product
    const product = new Product({
      productName,
      companyProductName,
      productDescription,
      category,
      taxClass,
      status,
      rentPrice,
      rentDuration,
      subCategory,
      salePrice,
      quantity: parseInt(quantity),
      range,
      minHireTime,
      rateDefinition,
      vat,
      rate,
      lenghtUnit,
      weightUnit,
      weight,
      length,
      width,
      height,
      vendorId,
      images,
    });

    // Save the product

    const savedProduct = await product.save();

    // Populate rateDefinition field
    await savedProduct.populate(["taxClass", "rateDefinition"]);
    // Respond with success message
    res.status(201).json({
      success: true,
      message: "Product added successfully",
      // product: savedProduct,
    });
  } catch (error) {
    // Handle unexpected errors
    console.error("Error adding product:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while adding the product.",
    });
  }
};

// Update Product Api
exports.updateProduct = async (req, res) => {
  const vendorId = req.user;
  try {
    const { productId } = req.params;

    const {
      productName,
      companyProductName,
      productDescription,
      category,
      status,
      taxClass,
      rentPrice,
      rentDuration,
      salePrice,
      availability,
      rateDefinition,
      quantity,
      range,
      minHireTime,
      vat,
      rate,
      subCategory,
      lenghtUnit,
      weightUnit,
      weight,
      length,
      width,
      height,
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
      taxClass,
      rentPrice,
      rentDuration,
      salePrice,
      availability,
      rateDefinition,
      quantity,
      range,
      minHireTime,
      vat,
      rate,
      lenghtUnit,
      weightUnit,
      weight,
      length,
      width,
      height,
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
    const vendorId = req.user;

    if (!vendorId) {
      return res.status(400).json({ error: "Vendor ID is required" });
    }

    const products = await Product.find({ vendorId })
      .sort({
        createdAt: -1,
      })
      .populate(["category", "subCategory", "rateDefinition"]);
    const inStock = (quantity) => {
      if (quantity === 0) {
        return "OUTOFSTOCK";
      }
      if (quantity > 0 && quantity < 10) {
        return "LOWSTOCK";
      }
      if (quantity > 10) {
        return "INSTOCK";
      }
    };
    const transformedProducts = products.map((product) => ({
      id: product._id,
      companyProductName: product.companyProductName,
      productDescription: product.productDescription,
      productName: product.productName,
      category: product.category,
      sub_category: product.subCategory,
      taxClass: product.taxClass,
      status: product.status,
      rentPrice: product.rentPrice,
      rentDuration: product.rentDuration,
      salePrice: product.salePrice,
      quantity: product.quantity,
      range: product.range,
      minHireTime: product.minHireTime,
      vat: product.vat,
      minimumRentalPeriod: product?.rateDefinition?.minimumRentalPeriod,
      rate: product.rate,
      lenghtUnit: product.lenghtUnit,
      weightUnit: product.weightUnit,
      weight: product.weight,
      length: product.length,
      width: product.width,
      stockStatus: inStock(Number(product.quantity)),
      height: product.height,
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
  const vendorId = req.user;
  try {
    const { productId } = req.params;

    if (!productId) {
      return res.status(400).json({ message: "Product ID is required" });
    }

    const product = await Product.findByIdAndDelete({
      _id: productId,
      vendorId,
    });

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
    const product = await Product.findById(id)
      .select("-__v")
      .populate(["category", "subCategory"]);

    if (!product) {
      return res
        .status(404)
        .json({ message: "Product not found", success: false });
    }

    res.status(200).json({ product, success: true });
  } catch (error) {
    res.status(500).json({ success: false });
  }
};

exports.getProductsBySearch = async (req, res) => {
  try {
    const { search } = req.query;

    const vendorId = req.user;

    if (!vendorId) {
      return res.status(400).json({ error: "Vendor ID is required" });
    }

    // Construct the query object
    let query = { vendorId };

    if (search) {
      query.$or = [
        { status: { $regex: search, $options: "i" } },
        { productName: { $regex: search, $options: "i" } },
        { companyProductName: { $regex: search, $options: "i" } },
      ];
    }
    const totalCount = await Product.countDocuments(query);
    const products = await Product.find(query)
      .sort({
        createdAt: -1,
      })
      .populate(["category", "subCategory", "rateDefinition", "taxClass"]);

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
      quantity: product.quantity,
      range: product.range,
      minHireTime: product.minHireTime,
      taxClass: product.taxClass,
      vat: product.vat,
      rateDefinition: product.rateDefinition,
      rate: product.rate,
      lenghtUnit: product.lenghtUnit,
      weightUnit: product.weightUnit,
      weight: product.weight,
      length: product.length,
      width: product.width,
      height: product.height,
      vendorId: product.vendorId,
      thumbnail: product.images[0],
      isActive: product.isActive,
      title: product.productName,
    }));

    res.status(200).json({
      success: true,
      data: transformedProducts,
      count: totalCount,
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error fetching products", details: error.message });
  }
};
