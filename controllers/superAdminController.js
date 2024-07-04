const Vender = require("../models/venderModel");
const Product = require("../models/productModel");

exports.AllVendorList = async (req, res) => {
  try {
    const vendors = await Vender.find().sort({
      createdAt: -1,
    });
    const productCounts = await Product.aggregate([
      { $group: { _id: "$vendorId", count: { $sum: 1 } } },
    ]);

    const productCountMap = productCounts.reduce((map, productCount) => {
      map[productCount._id] = productCount.count;
      return map;
    }, {});

    const list = vendors.map((vendor) => ({
      id: vendor._id,
      thumbnail: vendor.profile_Picture,
      title: vendor.companyName,
      status: vendor.status,
      product: productCountMap[vendor._id] || 0,
      role: vendor.role,
    }));

    res.status(200).json({
      success: true,
      data: list,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};
