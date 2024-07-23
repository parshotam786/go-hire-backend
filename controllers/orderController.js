const Order = require("../models/orderModel");
const Product = require("../models/productModel");

const { errorResponse, successResponse } = require("../utiles/responses");

const generateAlphanumericId = (length = 8) => {
  return Math.random()
    .toString(36)
    .substring(2, 2 + length)
    .toUpperCase();
};
const getOrder = async (req, res) => {
  // const findOrder = await Order.find({ orderId: req.params?.id })
  console.log("re", req.params);
  const findOrder = await Order.findById(req.params?.id).populate(
    "products.product"
  );

  if (!findOrder) {
    return res.status(404).json({ error: "Order not found" });
  }
  return res.status(200).json({ data: findOrder });
};

const getAllOrders = async (req, res) => {
  const page = req?.query?.page ?? 1;
  const limit = req?.query?.limit ?? 30;
  const findOrders = await Order.find({ vendorId: req.user?._id })
    .populate(["products.product", "customerId"])
    .sort("-createdAt")
    .skip((page - 1) * limit)
    .limit(limit);

  return res.status(200).json({ data: findOrders });
};
const createOrder = async (req, res) => {
  const { account, vendorId, customerId } = req.body;

  // const validation = {
  //     account, vendorId, customerId
  // }
  // for (let key in validation) {
  //     if (validation[key]) {
  //         return res.status(400).json({ error: `${key} is missing` })
  //     }
  // }

  req.body.orderId = generateAlphanumericId();
  const create = new Order(req.body);
  const created = await create.save();
  if (created) {
    return res.status(200).json({
      data: created,
      message: "Order created successfully",
      success: true,
    });
  }
};

// Get Customer Orders
const getCustomerOrders = async (req, res) => {
  const page = req?.query?.page ?? 1;
  const limit = req?.query?.limit ?? 30;
  console.log("a", page, limit);
  const findOrders = await Order.find({ vendorId: req.user?._id })
    .populate(["products.product", "customerId"])
    .sort("-createdAt")
    .skip((page - 1) * limit)
    .limit(limit);

  return res.status(200).json({ data: findOrders });
};

const addProductInOrder = async (req, res) => {
  const { orderId, ...rest } = req?.body;

  const validation = {
    orderId: orderId,
    quantity: rest?.quantity,
    rate: rest?.rate,
    price: rest?.price,
    product: rest?.product,
  };
  for (let key in validation) {
    if (!validation[key]) {
      return res.status(400).json({ error: `${key} is missing` });
    }

    if (["price", "quantity"].includes(key) && validation[key] <= 0) {
      return res.status(400).json({ error: `${key} must be greater than 0` });
    }
    try {
      const updated = await Order.findOneAndUpdate(
        { _id: orderId },
        { $addToSet: { products: { ...rest, status: "allocated" } } },
        { new: true }
      ).populate("products.product");
      if (updated) {
        return res.status(200).json({ data: updated });
      }
    } catch (error) {
      res.status(500).json({
        message: "Failed to add product in order",
        error: error.message,
      });
    }
  }
  if (!orderId) {
    return res.status(400).json({ error: "OrderId is missing" });
  }

  try {
    const updated = await Order.findOneAndUpdate(
      { _id: orderId },
      { $addToSet: { products: { ...rest, status: "allocated" } } },
      { new: true }
    ).populate("products.product");
    if (updated) {
      return res.status(200).json({ data: updated });
    }
  } catch (error) {
    res.status(500).json({
      message: "Failed to add product in order",
      error: error.message,
    });
  }
};

const deleteProductFromOrder = async (req, res) => {
  const { orderId, productId } = req.body;

  const vendorId = req.user._id;

  try {
    let isOrder = await Order.findOne({ _id: orderId, vendorId: vendorId });

    if (!isOrder)
      return errorResponse(res, { message: "order not found or removed!" });

    isOrder.products = isOrder.products.filter(
      (product) => product._id.toString() !== productId
    );

    const results = await isOrder.save();

    return successResponse(res, {
      message: "Item removed successfully.",
      data: { productId, results },
    });
  } catch (error) {
    return errorResponse(res, { message: error?.message || "Server Error!" });
  }
};

const deleteCustomerOrder = async (req, res) => {
  const { id: _id } = req.params;
  const { customerId } = req.body;
  const vendorId = req.user._id;

  try {
    if (!customerId) {
      return errorResponse(res, { message: "customer id required!" });
    }

    const isOrder = await Order.findOne({ _id, customerId, vendorId });

    if (!isOrder) {
      return errorResponse(res, { message: "Order not found!" });
    }

    await Order.deleteOne({ _id, customerId, vendorId });

    return successResponse(res, { message: "Order deleted successfully" });
  } catch (error) {
    return errorResponse(res, { message: error?.message || "Server Error!" });
  }
};

module.exports = {
  getOrder,
  createOrder,
  getAllOrders,
  addProductInOrder,
  deleteCustomerOrder,
  deleteProductFromOrder,
};
