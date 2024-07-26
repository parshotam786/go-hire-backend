const { default: mongoose } = require("mongoose");
const Invoice = require("../models/invoiceModel");
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
        { $addToSet: { products: { ...rest, status: "reserved" } } },
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
      data: { productId, orderId, results },
    });
  } catch (error) {
    return errorResponse(res, { message: error?.message || "Server Error!" });
  }
};

const deleteCustomerOrder = async (req, res) => {
  const { customerId, orderId: _id } = req.body;
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

const getOrderProduct = async (req, res) => {
  const { id } = req.params;
  const { order_Id } = req.query;
  const { _id: vendorId } = req.user;

  try {
    const isOrder = await Order.findOne({
      orderId: order_Id,
      vendorId,
    })?.populate("products.product");

    if (!isOrder) return errorResponse(res, { message: "product not found!" });

    const isProduct = isOrder.products.find(
      (product) => product._id.toString() === id
    );

    if (!isProduct) return errorResponse(res, { message: "product not found" });

    return successResponse(res, { data: { product: isProduct } });
  } catch (error) {
    return errorResponse(res, { message: error?.message || "Server Error!" });
  }
};

const updateOrderProduct = async (req, res) => {
  const { orderId, itemId, productId, ...rest } = req.body;
  const vendorId = req.user._id;

  const updatedProduct = {
    quantity: rest?.quantity,
    rate: rest?.rate,
    price: rest?.price,
    status: rest?.status, // make sure to include status if it's part of the update
  };

  try {
    const updateResult = await Order.updateOne(
      { orderId: orderId, vendorId, "products._id": itemId },
      {
        $set: {
          "products.$.quantity": updatedProduct.quantity,
          "products.$.rate": updatedProduct.rate,
          "products.$.price": updatedProduct.price,
          "products.$.status": updatedProduct.status,
        },
      },
      { new: true }
    );

    // const updatedProduct = await Product.updateOne({_id:productId,vendorId},{
    //   productName:rest.productName,

    // })

    if (updateResult.nModified === 0) {
      return errorResponse(res, {
        message: "No product was updated. Please check the provided details.",
      });
    }

    const updatedOrder = await Order.findOne(
      { orderId: orderId, vendorId, "products._id": itemId },
      { "products.$": 1 }
    );

    if (!updatedOrder) {
      return errorResponse(res, { message: "Order or product not found." });
    }

    const updatedProductFields = updatedOrder.products[0];

    return successResponse(res, {
      message: "Product updated successfully.",
      data: updatedProductFields,
    });
  } catch (error) {
    return errorResponse(res, { message: error?.message || "Server Error!" });
  }
};

const allocateOrderProducts = async (req, res) => {
  const { orderId, productItemId, quantity } = req.body;
  const { _id: vendorId } = req.user;

  const validation = {
    orderId: orderId,
    quantity: quantity,
    productItemId: productItemId,
  };

  for (let key in validation) {
    if (!validation[key]) {
      return errorResponse(res, { message: `${key} is missing` });
    }
  }

  try {
    const order = await Order.findOne({ _id: orderId, vendorId });

    if (!order) return errorResponse(res, { message: "Order not found!" });

    const product = order.products.find(
      (item) => item._id.toString() === productItemId
    );

    if (!product) {
      return errorResponse(res, { message: "Product not found in the order!" });
    }

    if (product.status === "allocated") {
      await Order.findOneAndUpdate(
        { _id: orderId, "products._id": productItemId, vendorId },
        {
          $set: {
            "products.$.status": "reserved",
          },
        }
      );
    } else {
      if (product.quantity < quantity) {
        return errorResponse(res, {
          message: "Insufficient product quantity!",
        });
      }

      if (product.quantity == quantity) {
        // Update the status directly
        await Order.findOneAndUpdate(
          { _id: orderId, "products._id": productItemId, vendorId },
          {
            $set: {
              "products.$.status": "allocated",
            },
          }
        );
      } else {
        // Update the original product's quantity
        await Order.findOneAndUpdate(
          { _id: orderId, "products._id": productItemId, vendorId },
          {
            $inc: {
              "products.$.quantity": -quantity,
            },
          }
        );

        // Add a new product clone with the allocated quantity
        await Order.findOneAndUpdate(
          { _id: orderId, vendorId },
          {
            $push: {
              products: {
                product: product.product,
                quantity: quantity,
                rate: product.rate,
                price: product.price,
                status: "allocated",
              },
            },
          }
        );
      }
    }

    const updatedOrder = await Order.findOne({
      _id: orderId,
      vendorId,
    }).populate("products.product");

    return successResponse(res, {
      message: "Product status changed successfully!",
      data: updatedOrder,
    });
  } catch (error) {
    return errorResponse(res, { message: error?.message || "Server Error!" });
  }
};

const bookOrderInvoice = async (req, res) => {
  const { orderId, productIds = [], reference, bookDate } = req.body;

  const { _id: vendorId } = req.user;

  if (!orderId) return errorResponse(res, { message: "orderId is missing" });

  if (!productIds || productIds?.length === 0)
    return errorResponse(res, {
      message: !productIds ? "productIds is missing" : "productIds is empty!",
    });

  try {
    const objectProductIds = productIds.map(
      (id) => new mongoose.Types.ObjectId(id)
    );

    // Update the status of the specified products to "onrent"
    const order = await Order.findOneAndUpdate(
      { orderId: orderId, vendorId },
      { $set: { "products.$[elem].status": "onrent" } },
      {
        arrayFilters: [{ "elem._id": { $in: objectProductIds } }],
        new: true,
      }
    );

    let invoice = await Invoice.findOne({ orderId: order._id });

    if (!invoice) {
      invoice = new Invoice({
        orderId: order._id,
        customerId: order.customerId,
        invoiceRefrence: reference,
        bookDate: bookDate ?? new Date(),
      });

      const results = await invoice.save();

      return successResponse(res, {
        message: "invoice generated succesfully",
        data: results.invoiceNumber,
      });
    }

    return successResponse(res, {
      message: "invoice generated succesfully",
      data: { invoiceNumber: invoice.invoiceNumber, productIds },
    });
  } catch (error) {
    return errorResponse(res, { message: error?.message || "Server Error!" });
  }
};

const generateOrderInvoice = async (req, res) => {
  const { invoiceNumber, productIds = [] } = req.body;

  // const { _id: vendorId } = req.user;

  // const validation = {
  //   orderId,
  //   productIds,
  // };

  // if (!orderId) return errorResponse(res, { message: "orderId is missing" });

  // if (!productIds || productIds?.length === 0)
  //   return errorResponse(res, {
  //     message: !productIds ? "productIds is missing" : "productIds is empty!",
  //   });

  // for (let key in validation) {
  //   if (!validation[key]) {
  //     return errorResponse(res, { message: `${key} is missing` });
  //   }
  // }

  try {
    const objectProductIds = productIds.map(
      (id) => new mongoose.Types.ObjectId(id)
    );

    // // Update the status of the specified products to "onrent"
    // const order = await Order.findOneAndUpdate(
    //   { orderId: orderId, vendorId },
    //   { $set: { "products.$[elem].status": "onrent" } },
    //   {
    //     arrayFilters: [{ "elem._id": { $in: objectProductIds } }],
    //     new: true,
    //   }
    // );

    const invoiceData = await Invoice.aggregate([
      {
        $match: { invoiceNumber: invoiceNumber },
      },
      {
        $lookup: {
          from: "orders",
          localField: "orderId",
          foreignField: "_id",
          as: "orderDetails",
        },
      },
      {
        $unwind: "$orderDetails",
      },
      {
        $lookup: {
          from: "customers",
          localField: "orderDetails.customerId",
          foreignField: "_id",
          as: "customerDetails",
        },
      },
      // {
      //   $unwind: "$orderDetails",
      // },
      {
        $unwind: "$customerDetails",
      },

      {
        $lookup: {
          from: "products", // Collection name for Product schema
          let: { productIds: "$orderDetails.products.product" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $in: ["$_id", "$$productIds"],
                },
              },
            },
          ],
          as: "productDetails",
        },
      },

      {
        $addFields: {
          "orderDetails.products": {
            $map: {
              input: "$orderDetails.products",
              as: "product",
              in: {
                $mergeObjects: [
                  "$$product",
                  {
                    productDetails: {
                      $arrayElemAt: [
                        "$productDetails",
                        {
                          $indexOfArray: [
                            "$productDetails._id",
                            "$$product.product",
                          ],
                        },
                      ],
                    },
                  },
                ],
              },
            },
          },
        },
      },

      {
        $addFields: {
          "orderDetails.products": {
            $filter: {
              input: "$orderDetails.products",
              as: "product",
              cond: {
                $and: [
                  { $eq: ["$$product.status", "onrent"] },
                  { $in: ["$$product._id", objectProductIds] },
                ],
              },
            },
          },
        },
      },
    ]);

    return successResponse(res, {
      data: invoiceData[0],
      message: "invoice fetch succesfully",
    });
  } catch (error) {
    return errorResponse(res, { message: error?.message || "Server Error!" });
  }
};

//exports
module.exports = {
  getOrder,
  createOrder,
  getAllOrders,
  getOrderProduct,
  addProductInOrder,
  updateOrderProduct,
  deleteCustomerOrder,
  allocateOrderProducts,
  deleteProductFromOrder,
  generateOrderInvoice,
  bookOrderInvoice,
};
