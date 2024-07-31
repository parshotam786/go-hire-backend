const Product = require("../models/productModel");
const Category = require("../models/categoriesModal");
const XLSX = require('xlsx');

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
      rate,
      quantity,
      range,
      minHireTime,
      vat,
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
      quantity,
      range,
      minHireTime,
      vat,
      rate,
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
      quantity,
      range,
      minHireTime,
      vat,
      rate,
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
      quantity,
      range,
      minHireTime,
      vat,
      rate,
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

    const products = await Product.find({ vendorId })
      .sort({
        createdAt: -1,
      })
      .populate(["category", "subCategory"]);

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
      vat: product.vat,
      rate: product.rate,
      vendorId: product.vendorId,
      thumbnail: product.images[0],
      isActive: product.isActive,
      title: product.productName,
    }));
    console.log({transformedProducts})

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
    const product = await Product.findById(id)
      .select("-__v")
      .populate(["category", "subCategory"]);

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

exports.getProductsBySearch = async (req, res) => {
  try {
    const { vendorId, search } = req.query;

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
      .populate(["category", "subCategory"]);

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
      vat: product.vat,
      rate: product.rate,
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
// get products available 
exports.getProductAvailability = async (req, res) => {
  try {
    const { page = 1, limit = 10, vendorId, startDate, endDate, categoryName, type, quote } = req.query;

    const query = { vendorId };
    
    if (!vendorId) {
      return res.status(400).json({ error: "Vendor ID is required" })
    }

    if (categoryName) {
      const category = await Category.findOne({ name: categoryName });
      if (category) {
        query.category = category._id;
      } else {
        return res.status(404).json({ error: "Category not found" });
      }
    }

    if (type) {
      if (type === 'rent') {
        query.status = { $regex: /^Rental/i };
      } else if (type === 'sale') {
        query.status = { $regex: /^Sale/i };
      }
    }

    if (quote === 'yes') {
      query.quote = { $exists: true, $ne: null };
    } else if (quote === 'no') {
      query.quote = null;
    }

    if (startDate && endDate) {
      query.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
      query.updatedAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }
    
    const products = await Product.find(query)
      .populate('category', 'name')
      .populate('subCategory', 'name')
      .skip( (page - 1) * limit )
      .limit(parseInt(limit))
      .exec();

      const totalProducts = await Product.countDocuments(query);
      res.status(200).json({
        message: "Products retrieved successfully",
        success: true,
        data: products,
        totalPages: Math.ceil(totalProducts / limit),
        currentPage: parseInt(page)
      })

    // res.status(200).json({ data: products });
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

exports.getStockView = async (req, res) => {
  try {
    const { category } = req.query
        
    if (!category) {
      return res.status(400).json({ error: "Category ID is required" })
    }

    const categoryIds = category.split(",");

    const categoryObjectIds = categoryIds.map((id) => id.trim(' '));

    const products = await Product.find({ category: { $in: categoryObjectIds } })

    if (!products || products.length == 0) {
      return res.status(400).json({ error: "Product not found" })
    }

    res.status(200).json({ data: products })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

exports.addProductsByExcel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const excelFilePath = req.file.path;
    const workbook = XLSX.readFile(excelFilePath);
    const sheetName = workbook.SheetNames[0]; // Assuming data is in the first sheet
    const worksheet = workbook.Sheets[sheetName];
    const excelData = XLSX.utils.sheet_to_json(worksheet);

    const products = [];

    for (let data of excelData) {
      const {
        productName,
        companyProductName,
        productDescription,
        category,
        status,
        rentPrice,
        rentDuration,
        salePrice,
        quantity,
        minHireTime,
        vat,
        subCategory,
        vendorId,
        thumbnail, // Assuming thumbnail path is included in the sheet
      } = data;

      // Process thumbnail path to get absolute path if needed
      const thumbnailPath = thumbnail ? thumbnail : "images/default-thumbnail.jpg"; // Default image if not provided

      const product = new Product({
        productName,
        companyProductName,
        productDescription,
        category, // Assuming category and subCategory are ObjectId references
        status,
        rentPrice,
        rentDuration,
        salePrice,
        quantity,
        minHireTime,
        vat,
        subCategory,
        vendorId,
        images: [thumbnailPath], // Store image path in an array
      });

      products.push(product);
    }

    // Save all products to the database
    await Product.insertMany(products);

    res.status(201).json({
      message: "Products added successfully",
      count: products.length,
      products,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error adding products", error: error.message });
  }
};