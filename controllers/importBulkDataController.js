const fs = require("fs");
const csvParser = require("csv-parser");
const Product = require("../models/productModel");

exports.addProductByCSV = async (req, res) => {
  const vendorId = req.user._id;

  try {
    if (!req.file) {
      return res.status(400).json({ error: "No CSV file uploaded" });
    }

    const results = [];
    const filePath = req.file.path;

    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on("data", (row) => {
        results.push(row);
      })
      .on("end", async () => {
        try {
          const productsToSave = results.map((row) => ({
            productName: row.productName,
            companyProductName: row.companyProductName,
            productDescription: row.productDescription,
            category: "66b5c1a2f472ebd7c9fdf891",
            status: row.status,
            rentPrice: row.rentPrice,
            rentDuration: row.rentDuration,
            subCategory: "66b5c1a2f472ebd7c9fdf891",
            salePrice: row.salePrice,
            quantity: row.quantity,
            range: row.range,
            minHireTime: row.minHireTime,
            vat: row.vat,
            rate: row.rate,
            vendorId: vendorId,
            images: row.images ? row.images.split("|") : [], // Assuming images are separated by '|' in CSV
          }));

          // Insert all products at once
          const insertedProducts = await Product.insertMany(productsToSave);

          res.status(201).json({
            success: true,
            message: `${insertedProducts.length} products added successfully`,
            products: insertedProducts,
          });
        } catch (err) {
          res
            .status(500)
            .json({ error: "Error saving products", details: err.message });
        }
      });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error processing CSV file", details: error.message });
  }
};
