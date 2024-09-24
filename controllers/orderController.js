const { default: mongoose } = require("mongoose");
const Invoice = require("../models/invoiceModel");
const Order = require("../models/orderModel");
const Product = require("../models/productModel");

const Document = require("../models/documentNumber");

const { errorResponse, successResponse } = require("../utiles/responses");
const DeliverNote = require("../models/deliveryNote");
const ReturnNote = require("../models/returnNote");
const QuickBooks = require("node-quickbooks");
const Quickbook = require("../models/quickbookAuth");
const Vender = require("../models/venderModel");
const nodemailer = require("nodemailer"); // Require nodemailer
const { chromium } = require("playwright"); // Use Playwright instead of Puppeteer

const venderModel = require("../models/venderModel");
const htmlPdf = require("html-pdf");
const puppeteer = require("puppeteer");
const fs = require("fs");
const Handlebars = require("handlebars");
const moment = require("moment/moment");
const path = require("path");

const generateAlphanumericId = async (vendorId, type = "Order") => {
  const document = await Document.findOne({ name: type, vendorId });
  const uniqueId =
    document.code + "-" + (document.seed + document.counter).toString();

  return uniqueId;
};

const getOrder = async (req, res) => {
  // const findOrder = await Order.find({ orderId: req.params?.id })
  const findOrder = await Order.findById(req.params?.id).populate(
    "products.product"
  );

  if (!findOrder) {
    return res.status(404).json({ error: "Order not found" });
  }
  return res.status(200).json({ data: findOrder, success: true });
};

// Get all order - Paginations
const getAllOrders = async (req, res) => {
  try {
    // Extract query parameters for pagination and search
    const page = parseInt(req.query.page, 10) || 1; // Default to page 1 if not provided
    const limit = parseInt(req.query.limit, 10) || 30; // Default to 30 items per page if not provided
    const searchQuery = req.query.search || ""; // Search query parameter

    // Build the search query object
    const searchCriteria = {
      vendorId: req.user?._id, // Filter by vendorId from the authenticated user
      $or: [
        // Search within certain fields
        { orderId: { $regex: searchQuery, $options: "i" } }, // Case-insensitive search on orderId
        { account: { $regex: searchQuery, $options: "i" } }, // Case-insensitive search on account
        { billingPlaceName: { $regex: searchQuery, $options: "i" } }, // Case-insensitive search on billingPlaceName
        { address1: { $regex: searchQuery, $options: "i" } }, // Case-insensitive search on address1
        { city: { $regex: searchQuery, $options: "i" } }, // Case-insensitive search on city
        { country: { $regex: searchQuery, $options: "i" } }, // Case-insensitive search on country
      ],
    };

    // Fetch orders with pagination, search, and sorting
    const findOrders = await Order.find(searchCriteria)
      .populate(["products.product", "customerId"])
      .sort("-createdAt")
      .skip((page - 1) * limit)
      .limit(limit);

    // Count total matching documents for pagination info
    const totalOrders = await Order.countDocuments(searchCriteria);

    return res.status(200).json({
      data: findOrders,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalOrders / limit),
        totalItems: totalOrders,
      },
      success: true,
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return res
      .status(500)
      .json({ error: "Internal server error", success: false });
  }
};

const createOrder = async (req, res) => {
  const { account, customerId } = req.body;
  const { _id: vendorId } = req.user;

  req.body.orderId = await generateAlphanumericId(vendorId, "Order");
  const create = new Order(req.body);
  const created = await create.save();

  await Document.findOneAndUpdate(
    { name: "Order", vendorId: vendorId },
    { $inc: { counter: 1 } },
    { new: true }
  );

  if (created) {
    return res.status(200).json({
      data: created,
      message: "Order created successfully",
      success: true,
    });
  }
};
//updated order api

const updateOrder = async (req, res) => {
  try {
    const { id } = req.params; // Order ID from the URL parameter
    const updates = req.body; // Fields to update from the request body

    // Convert orderId to ObjectId if it's a string

    // Find the order by ID and update it
    const updatedOrder = await Order.findByIdAndUpdate(
      { _id: id }, // Find the order by _id
      { $set: updates }, // Apply updates
      { new: true, runValidators: true } // Return the updated document and run validators
    );

    if (!updatedOrder) {
      return res.status(404).json({
        message: "Order not found",
        success: false,
      });
    }

    return res.status(200).json({
      data: updatedOrder,
      message: "Order updated successfully",
      success: true,
    });
  } catch (error) {
    console.error("Error updating order:", error);
    return res.status(500).json({
      message: "Error updating order",
      success: false,
    });
  }
};

// Get Customer Orders
const getCustomerOrders = async (req, res) => {
  const page = req?.query?.page ?? 1;
  const limit = req?.query?.limit ?? 30;
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
    const productDoc = await Product.findById(rest.product);

    if (!productDoc) {
      return res.status(400).json({ error: "product not found" });
    }

    const availableQuantity = parseInt(productDoc.quantity);

    if (availableQuantity === 0) {
      return res.status(400).json({ error: "Product is out of stock!" });
    } else if (availableQuantity < parseInt(rest.quantity)) {
      return res
        .status(400)
        .json({ error: `Only ${availableQuantity} units available in stock!` });
    }

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
  const { orderId, productItemId, quantity, revert } = req.body;
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

    if (revert) {
      if (product.status === "allocated") {
        await Order.findOneAndUpdate(
          { _id: orderId, "products._id": productItemId, vendorId },
          {
            $set: {
              "products.$.status": "reserved",
            },
          }
        );
      } else if (product.status === "onrent") {
        await Order.findOneAndUpdate(
          { _id: orderId, "products._id": productItemId, vendorId },
          {
            $set: {
              "products.$.status": "allocated",
            },
          }
        );
      }
    } else {
      if (product.quantity < quantity) {
        return errorResponse(res, {
          message: "Insufficient product quantity!",
        });
      }

      if (product.quantity == quantity) {
        await Order.findOneAndUpdate(
          { _id: orderId, "products._id": productItemId, vendorId },
          {
            $set: {
              "products.$.status": "allocated",
            },
          }
        );
      } else {
        await Order.findOneAndUpdate(
          { _id: orderId, "products._id": productItemId, vendorId },
          {
            $inc: {
              "products.$.quantity": -quantity,
            },
          }
        );

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
      { _id: orderId, vendorId },
      { $set: { "products.$[elem].status": "onrent" } },
      {
        arrayFilters: [{ "elem._id": { $in: objectProductIds } }],
        new: true,
      }
    );

    let invoice = await Invoice.findOne({ orderId: order._id });

    if (!invoice) {
      const invoiceNumber = await generateAlphanumericId(vendorId, "Invoice");

      invoice = new Invoice({
        vendorId,
        invoiceNumber,
        orderId: order._id,
        customerId: order.customerId,
        invoiceRefrence: reference,
        bookDate: bookDate ?? new Date(),
      });

      const results = await invoice.save();
      await Document.findOneAndUpdate(
        { name: "Invoice", vendorId: vendorId },
        { $inc: { counter: 1 } },
        { new: true }
      );

      return successResponse(res, {
        message: "invoice generated succesfully",
        data: { invoiceId: results._id, productIds },
      });
    }

    return successResponse(res, {
      message: "invoice generated succesfully",
      data: { invoiceId: invoice._id, productIds },
    });
  } catch (error) {
    return errorResponse(res, { message: error?.message || "Server Error!!" });
  }
};

const generateOrderInvoice = async (req, res) => {
  const { invoiceId, productIds = [] } = req.body;

  try {
    const objectProductIds = productIds.map(
      (id) => new mongoose.Types.ObjectId(id)
    );

    const invoiceData = await Invoice.aggregate([
      {
        $match: { _id: new mongoose.Types.ObjectId(invoiceId) },
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
                  ...(productIds.length > 0
                    ? [{ $in: ["$$product._id", objectProductIds] }]
                    : []),
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

const generateOrderNote = async (req, res) => {
  const { id, type } = req.body;
  const vendorId = req.user._id;

  if (!id || !type) {
    return errorResponse(res, { message: "Invalid fields!" });
  }

  const Model = type?.toUpperCase() === "DN" ? DeliverNote : ReturnNote;

  try {
    const [deliveryData] = await Model.aggregate([
      {
        $match: { _id: new mongoose.Types.ObjectId(id) },
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
      {
        $unwind: "$customerDetails",
      },
      // {
      //   $lookup: {
      //     from: "products",
      //     localField: "products.product",
      //     foreignField: "_id",
      //     as: "products",
      //   },
      // },
      // {
      //   $project: {
      //     productDetails: 0, // Remove the temporary field used for merging
      //   },
      // },
    ]);

    if (!deliveryData) {
      return errorResponse(res, { message: "No data found" });
    }

    const populatedData = await Model.findById(id).populate({
      path: "products.product",
      select: "productName status",
    });

    const mergedProducts = deliveryData.products.map((product) => {
      const populatedProduct = populatedData.products.find(
        (p) => p.product._id.toString() === product.product.toString()
      );

      if (populatedProduct) {
        return {
          ...product,
          productName: populatedProduct.product.productName,
          type: populatedProduct.product.status,
        };
      }

      return product;
    });

    deliveryData.products = mergedProducts;
    const vender = await venderModel.findById(vendorId);

    const isQuickBookAccountExist = vender.isQuickBook;
    console.log(
      "start",
      deliveryData.orderDetails.cunstomerQuickbookId,
      "ddddd"
    );

    if (
      isQuickBookAccountExist &&
      deliveryData.orderDetails.cunstomerQuickbookId != null &&
      deliveryData.orderDetails.cunstomerQuickbookId !== ""
    ) {
      const invoice = {
        Line: deliveryData.products.map((item) => ({
          Description: item.productName,
          Amount: item.price * item.quantity,
          DetailType: "SalesItemLineDetail",
          SalesItemLineDetail: {
            UnitPrice: item.price,
            Qty: item.quantity,
          },
        })),
        CustomerRef: {
          value: `${deliveryData.customerDetails.customerID}`,
          name: deliveryData.customerDetails.name,
        },
        BillEmail: {
          Address: deliveryData.customerDetails.email, // Customer's email
        },
        BillAddr: {
          Line1: deliveryData.customerDetails.addressLine1,
          City: deliveryData.customerDetails.city,
          PostalCode: deliveryData.customerDetails.postCode,
        },
        SalesTermRef: {
          value: "1", // Payment terms (e.g., Net 30)
        },
        DueDate: "2024-09-01", // Invoice due date
        TotalAmt: deliveryData.products.reduce(
          (total, item) => total + item.price * item.quantity, // Sum up all dynamically calculated amounts
          0
        ),
      };
      const existingRecord = await Quickbook.findOne({ vendorId });
      const qbo = new QuickBooks(
        process.env.CLIENT_ID,
        process.env.CLIENT_SECRET,
        existingRecord.accessToken,
        false, // No token secret for OAuth2
        existingRecord.realmId,
        true, // use sandbox
        true, // debug mode
        existingRecord.refreshToken,
        "2.0" // OAuth version
      );

      qbo.createInvoice(invoice, function (err, invoice) {
        if (err) {
          return res.send({
            message: "AUTHENTICATION",
          });
        } else {
          return successResponse(res, {
            data: deliveryData,
            message: "Invoice fetched successfully",
          });
        }
      });
    } else {
      return successResponse(res, {
        data: deliveryData,
        message: "Invoice fetched successfully",
      });
    }
  } catch (error) {
    return errorResponse(res, { message: error?.message || "Server Error!" });
  }
};

const invoicePDF = async (req, res) => {
  const { id, type } = req.body;
  const vendorId = req.user._id;

  // Validate inputs
  if (!id || !type) {
    return res.status(400).json({ message: "Invalid fields!" });
  }

  const Model = type?.toUpperCase() === "DN" ? DeliverNote : ReturnNote;

  try {
    // Fetching delivery data and related details
    const [deliveryData] = await Model.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(id) } },
      {
        $lookup: {
          from: "orders",
          localField: "orderId",
          foreignField: "_id",
          as: "orderDetails",
        },
      },
      { $unwind: "$orderDetails" },
      {
        $lookup: {
          from: "customers",
          localField: "orderDetails.customerId",
          foreignField: "_id",
          as: "customerDetails",
        },
      },
      { $unwind: "$customerDetails" },
    ]);

    if (!deliveryData) {
      return res.status(404).json({ message: "No data found" });
    }

    // Populate additional data
    const populatedData = await Model.findById(id).populate({
      path: "products.product",
      select: "productName status",
    });

    const mergedProducts = deliveryData.products.map((product) => {
      const populatedProduct = populatedData.products.find(
        (p) => p.product._id.toString() === product.product.toString()
      );

      if (populatedProduct) {
        return {
          ...product,
          productName: populatedProduct.product.productName,
          type: populatedProduct.product.status,
        };
      }

      return product;
    });

    deliveryData.products = mergedProducts;
    const vendor = await venderModel.findById(vendorId);

    // Prepare invoice data
    const invoiceData = {
      brandLogo: vendor.brandLogo,
      invoiceDate: moment(deliveryData.bookDate).format("l"),
      invoiceNumber: deliveryData.deliveryNote || deliveryData.returnNote,
      deliveryAddress: deliveryData.orderDetails.deliveryAddress1,
      customerName: deliveryData.customerDetails.name,
      customerAddress: deliveryData.customerDetails.addressLine1,
      customerCity: deliveryData.customerDetails.city,
      customerCountry: deliveryData.customerDetails.country,
      customerPostCode: deliveryData.customerDetails.postCode,
      customerEmail: deliveryData.customerDetails.email,
      orderId: deliveryData.orderDetails.orderId,
      orderType: deliveryData.deliveryNote,
      orderNumber: deliveryData.orderDetails.orderId,
      deliveryDate: moment(deliveryData.orderDetails.deliveryDate).format(
        "lll"
      ),
      orderDate: moment(deliveryData.orderDetails.orderDate).format("lll"),
      deliveryPlaceName: deliveryData.orderDetails.city,
      products: deliveryData.products.map((item) => ({
        productName: item.productName,
        quantity: item.quantity,
        type: item.type,
        price: item.price,
        total: item.quantity * item.price,
      })),
      totalPrice: deliveryData.products.reduce(
        (acc, item) => acc + item.price * item.quantity,
        0
      ),
    };

    // Load and compile HTML template
    const templatePath = path.join(__dirname, "invoice.html");
    const templateHtml = fs.readFileSync(templatePath, "utf8");
    const template = Handlebars.compile(templateHtml);
    const html = template(invoiceData);

    // Launch Puppeteer and generate PDF
    const browser = await puppeteer.launch({
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--remote-debugging-port=9222",
      ],
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    let pathname = `${
      deliveryData.deliveryNote || deliveryData.returnNote
    }-${Date.now()}.pdf`;
    const pdfPath = path.join(
      __dirname.replace("/controllers", ""),
      "pdfs",
      pathname
    );
    await page.pdf({ path: pdfPath, format: "A4", printBackground: true });
    await browser.close();

    // Schedule file deletion after 1 minute (60000 ms)
    setTimeout(() => {
      fs.unlink(pdfPath, (err) => {
        if (err) {
          console.error(`Failed to delete file: ${pdfPath}`, err);
        } else {
          console.log(`Successfully deleted file: ${pdfPath}`);
        }
      });
    }, 10000); // 1 minute
    const baseUrl = `${req.protocol}://${req.get("host")}`;

    // Send back the URL for the PDF
    const pdfUrl = `${baseUrl}/pdfs/${pathname}`;
    res.json({ url: pdfUrl });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error!" });
  }
};

// const invoicePDF = async (req, res) => {
//   const { id, type } = req.body;
//   const vendorId = req.user._id;

//   // Validate inputs
//   if (!id || !type) {
//     return res.status(400).json({ message: "Invalid fields!" });
//   }

//   const Model = type?.toUpperCase() === "DN" ? DeliverNote : ReturnNote;

//   try {
//     const [deliveryData] = await Model.aggregate([
//       { $match: { _id: new mongoose.Types.ObjectId(id) } },
//       {
//         $lookup: {
//           from: "orders",
//           localField: "orderId",
//           foreignField: "_id",
//           as: "orderDetails",
//         },
//       },
//       { $unwind: "$orderDetails" },
//       {
//         $lookup: {
//           from: "customers",
//           localField: "orderDetails.customerId",
//           foreignField: "_id",
//           as: "customerDetails",
//         },
//       },
//       { $unwind: "$customerDetails" },
//     ]);

//     if (!deliveryData) {
//       return res.status(404).json({ message: "No data found" });
//     }

//     const populatedData = await Model.findById(id).populate({
//       path: "products.product",
//       select: "productName status",
//     });

//     const mergedProducts = deliveryData.products.map((product) => {
//       const populatedProduct = populatedData.products.find(
//         (p) => p.product._id.toString() === product.product.toString()
//       );

//       if (populatedProduct) {
//         return {
//           ...product,
//           productName: populatedProduct.product.productName,
//           type: populatedProduct.product.status,
//         };
//       }

//       return product;
//     });

//     deliveryData.products = mergedProducts;
//     const vender = await venderModel.findById(vendorId);

//     const brandLogo = vender.brandLogo;
//     const invoiceData = {
//       brandLogo: brandLogo, // Replace with actual logo path
//       invoiceDate: "2024-09-02",
//       invoiceNumber: deliveryData.deliveryNote || deliveryData.returnNote,
//       deliveryAddress: deliveryData.orderDetails.deliveryAddress1,
//       customerName: deliveryData.customerDetails.name,
//       customerAddress: deliveryData.customerDetails.addressLine1,
//       customerCity: deliveryData.customerDetails.city,
//       customerCountry: deliveryData.customerDetails.country,
//       customerPostCode: deliveryData.customerDetails.postCode,
//       customerEmail: deliveryData.customerDetails.email,
//       orderId: deliveryData.orderDetails.orderId,
//       orderType: deliveryData.deliveryNote,
//       orderNumber: deliveryData.orderDetails.orderId,
//       deliveryDate: moment(deliveryData.orderDetails.deliveryDate).format(
//         "lll"
//       ),
//       orderDate: moment(deliveryData.orderDetails.orderDate).format("lll"),
//       deliveryPlaceName: deliveryData.orderDetails.city,
//       products: deliveryData.products.map((item) => {
//         return {
//           productName: item.productName,
//           quantity: item.quantity,
//           type: item.type,
//           price: item.price,
//           total: item.quantity * item.price,
//         };
//       }),
//       totalPrice: deliveryData.products?.reduce(
//         (acc, item) => acc + item.price * item.quantity,
//         0
//       ),
//     };

//     const templatePath = path.join(__dirname, "invoice.html");
//     const templateHtml = fs.readFileSync(templatePath, "utf8");
//     const template = Handlebars.compile(templateHtml);
//     const html = template(invoiceData);

//     htmlPdf.create(html).toBuffer((err, pdfBuffer) => {
//       if (err) {
//         console.error(err);
//         return res.status(500).json({ message: "Server Error!" });
//       }

//       res.setHeader("Content-Type", "application/pdf");
//       res.setHeader(
//         "Content-Disposition",
//         'attachment; filename="invoice.pdf"'
//       );
//       res.send(pdfBuffer);
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Server Error!" });
//   }
// };
// const invoicePDF = async (req, res) => {
//   const { id, type } = req.body;
//   const vendorId = req.user._id;

//   // Validate inputs
//   if (!id || !type) {
//     return res.status(400).json({ message: "Invalid fields!" });
//   }

//   const Model = type?.toUpperCase() === "DN" ? DeliverNote : ReturnNote;

//   try {
//     const [deliveryData] = await Model.aggregate([
//       { $match: { _id: new mongoose.Types.ObjectId(id) } },
//       {
//         $lookup: {
//           from: "orders",
//           localField: "orderId",
//           foreignField: "_id",
//           as: "orderDetails",
//         },
//       },
//       { $unwind: "$orderDetails" },
//       {
//         $lookup: {
//           from: "customers",
//           localField: "orderDetails.customerId",
//           foreignField: "_id",
//           as: "customerDetails",
//         },
//       },
//       { $unwind: "$customerDetails" },
//     ]);

//     if (!deliveryData) {
//       return res.status(404).json({ message: "No data found" });
//     }

//     const populatedData = await Model.findById(id).populate({
//       path: "products.product",
//       select: "productName status",
//     });

//     const mergedProducts = deliveryData.products.map((product) => {
//       const populatedProduct = populatedData.products.find(
//         (p) => p.product._id.toString() === product.product.toString()
//       );

//       if (populatedProduct) {
//         return {
//           ...product,
//           productName: populatedProduct.product.productName,
//           type: populatedProduct.product.status,
//         };
//       }

//       return product;
//     });

//     deliveryData.products = mergedProducts;
//     const vender = await venderModel.findById(vendorId);

//     const brandLogo = vender.brandLogo;
//     const invoiceData = {
//       brandLogo: brandLogo, // Replace with actual logo path
//       invoiceDate: "2024-09-02",
//       invoiceNumber: deliveryData.deliveryNote || deliveryData.returnNote,
//       deliveryAddress: deliveryData.orderDetails.deliveryAddress1,
//       customerName: deliveryData.customerDetails.name,
//       customerAddress: deliveryData.customerDetails.addressLine1,
//       customerCity: deliveryData.customerDetails.city,
//       customerCountry: deliveryData.customerDetails.country,
//       customerPostCode: deliveryData.customerDetails.postCode,
//       customerEmail: deliveryData.customerDetails.email,
//       orderId: deliveryData.orderDetails.orderId,
//       orderType: deliveryData.deliveryNote,
//       orderNumber: deliveryData.orderDetails.orderId,
//       deliveryDate: moment(deliveryData.orderDetails.deliveryDate).format(
//         "lll"
//       ),
//       orderDate: moment(deliveryData.orderDetails.orderDate).format("lll"),
//       deliveryPlaceName: deliveryData.orderDetails.city,
//       products: deliveryData.products.map((item) => {
//         return {
//           productName: item.productName,
//           quantity: item.quantity,
//           type: item.type,
//           price: item.price,
//           total: item.quantity * item.price,
//         };
//       }),
//       totalPrice: deliveryData.products?.reduce(
//         (acc, item) => acc + item.price * item.quantity,
//         0
//       ),
//     };

//     const templateHtml = fs.readFileSync("invoice.html", "utf8");
//     const template = Handlebars.compile(templateHtml);
//     const html = template(invoiceData);
//     console.log(html);

//     const browser = await puppeteer.launch({ headless: true });
//     const page = await browser.newPage();
//     await page.setContent(html);
//     const pdfBuffer = await page.pdf({ format: "A4", printBackground: true });
//     await browser.close();

//     // Set headers and send PDF as response
//     res.setHeader("Content-Type", "application/pdf");
//     res.setHeader("Content-Disposition", 'attachment; filename="invoice.pdf"');
//     res.send(pdfBuffer);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Server Error!" });
//   }
// };

const handleOrderBooking = async (req, res, type) => {
  const { orderId, productIds = [], reference, bookDate } = req.body;
  const vendorId = req.user._id;

  const NoteModel = type === "bookOut" ? DeliverNote : ReturnNote;
  const noteType = type === "bookOut" ? "Delivery Note" : "Return Note";
  const productStatus = type === "bookOut" ? "onrent" : "offrent";

  try {
    const order = await Order.findById(orderId).populate("products.product");

    if (!order) {
      return errorResponse(res, { message: "Order not found", code: 404 });
    }

    const productsToBook = order.products.filter((prd) =>
      productIds.includes(prd._id.toString())
    );

    if (productsToBook.length === 0) {
      return errorResponse(res, {
        message: "No matching products found in the order",
      });
    }

    const updatedProducts = productsToBook.map((prd) => ({
      ...prd.toObject(),
      status: productStatus,
    }));

    const note = new NoteModel({
      customerId: order.customerId,
      orderId: order._id,
      vendorId,
      products: updatedProducts,
      reference,
      [`${type === "bookOut" ? "bookDate" : "returnDate"}`]: bookDate,
      [`${type === "bookOut" ? "deliveryNote" : "returnNote"}`]:
        await generateAlphanumericId(vendorId, noteType),
    });

    const results = await note.save();

    await Order.findByIdAndUpdate(
      orderId,
      {
        $set: {
          "products.$[elem].status": productStatus,
        },
      },
      {
        arrayFilters: [
          {
            "elem._id": {
              $in: productIds.map((id) => new mongoose.Types.ObjectId(id)),
            },
          },
        ],
        new: true,
      }
    );

    for (const prd of productsToBook) {
      const product = await Product.findById(prd.product);
      const currentQuantity = Number(product.quantity);
      const newQuantity =
        type === "bookOut"
          ? currentQuantity - prd.quantity
          : currentQuantity + prd.quantity;

      await Product.findByIdAndUpdate(prd.product._id, {
        $set: { quantity: parseInt(newQuantity) },
      });
    }

    await Document.findOneAndUpdate(
      { name: noteType, vendorId },
      { $inc: { counter: 1 } },
      { new: true }
    );

    return successResponse(res, {
      message: `${noteType} created successfully`,
      code: 201,
      data: {
        noteId: results._id,
        productIds,
        deliveryType: type === "bookOut" ? "DN" : "RN",
      },
    });
  } catch (error) {
    console.log(error);
    return errorResponse(res, { message: error?.message || "Server Error!" });
  }
};

const orderBookIn = (req, res) => handleOrderBooking(req, res, "bookIn");
const orderBookOut = (req, res) => handleOrderBooking(req, res, "bookOut");

// const invoiceByVendorId = async (req, res) => {
//   try {
//     const vendorId = req.user._id;

//     // Find all deliver notes for the given vendor ID
//     const deliverNotes = await DeliverNote.find({ vendorId })
//       .populate("customerId")
//       .populate("orderId");

//     if (!deliverNotes || deliverNotes.length === 0) {
//       return res
//         .status(404)
//         .json({ message: "No deliver notes found for this vendor" });
//     }
//     const vendor = await venderModel.findById(vendorId);
//     // Construct the invoice object
//     const invoiceData = deliverNotes.map((note) => ({
//       id: note._id,
//       brandLogo: vendor.brandLogo,
//       orderId: note.orderId ? note.orderId.orderId : null,
//       chargingStartDate: note.orderId ? note.orderId.chargingStartDate : null,
//       orderDate: note.orderId ? note.orderId.orderDate : null,
//       deliveryDate: note.orderId
//         ? moment(note.orderId.deliveryDate).format("lll")
//         : null,
//       deliveryAddress: note.orderId ? note.orderId.deliveryAddress1 : null,
//       customerName: note.customerId ? note.customerId.name : null,
//       customerAddress: note.customerId ? note.customerId.addressLine1 : null,
//       customerCity: note.customerId ? note.customerId.city : null,
//       customerCountry: note.customerId ? note.customerId.country : null,
//       customerPostCode: note.customerId ? note.customerId.postCode : null,
//       customerEmail: note.customerId ? note.customerId.email : null,
//       products: note.products,
//       totalPrice: note.products.reduce(
//         (acc, item) => acc + item.price * item.quantity,
//         0
//       ),
//       reference: note.reference,
//       bookDate: note.bookDate,
//       createdAt: note.createdAt,
//       updatedAt: note.updatedAt,
//     }));

//     // Send the response
//     res.status(200).json(invoiceData);
//   } catch (error) {
//     console.error("Error fetching invoices by vendor ID:", error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };

// Function to send email

// const invoiceByVendorId = async (req, res) => {
//   try {
//     const vendorId = req.user._id;
//     console.log("start");

//     const deliverNotes = await DeliverNote.find({ vendorId })
//       .populate("customerId")
//       .populate("orderId");

//     if (!deliverNotes || deliverNotes.length === 0) {
//       return res
//         .status(404)
//         .json({ message: "No deliver notes found for this vendor" });
//     }

//     const vendor = await venderModel.findById(vendorId);

//     const invoiceData = deliverNotes.map((note) => ({
//       id: note._id,
//       brandLogo: vendor.brandLogo,
//       orderId: note.orderId ? note.orderId.orderId : null,
//       chargingStartDate: note.orderId ? note.orderId.chargingStartDate : null,
//       orderDate: note.orderId ? note.orderId.orderDate : null,
//       deliveryDate: note.orderId
//         ? moment(note.orderId.deliveryDate).format("lll")
//         : null,
//       deliveryAddress: note.orderId ? note.orderId.deliveryAddress1 : null,
//       customerName: note.customerId ? note.customerId.name : null,
//       customerEmail: note.customerId ? note.customerId.email : null,
//       products: note.products,
//       totalPrice: note.products.reduce(
//         (acc, item) => acc + item.price * item.quantity,
//         0
//       ),
//       reference: note.reference,
//       bookDate: note.bookDate,
//       createdAt: note.createdAt,
//       updatedAt: note.updatedAt,
//     }));

//     // Create a transporter (this can be outside the loop if using a single SMTP connection)
//     // Looking to send emails in production? Check out our Email API/SMTP product!
//     var transporter = nodemailer.createTransport({
//       service: "gmail",
//       auth: {
//         user: "parshotamrughanii@gmail.com", // your Gmail account
//         pass: "walz hskf huzy yljv", // App Password from step 1
//       },
//     });

//     // Send emails concurrently
//     await Promise.all(
//       invoiceData.map(async (invoice) => {
//         const customerEmail = invoice.customerEmail;
//         if (customerEmail) {
//           const mailOptions = {
//             from: "parshotamrughanii@gmail.com",
//             to: customerEmail, // Send to the specific customer email
//             subject: "Invoice Details",
//             text: `Dear ${invoice.customerName}, please find the invoice details:\nOrder ID: ${invoice.orderId}\nTotal Price: ${invoice.totalPrice}\nDelivery Date: ${invoice.deliveryDate}`,
//           };

//           // Send the email
//           try {
//             await transporter.sendMail(mailOptions);
//             console.log(`Email sent to ${customerEmail}`);
//           } catch (error) {
//             console.error(`Error sending email to ${customerEmail}:`, error);
//           }
//         }
//       })
//     );

//     res.status(200).json({
//       message: "Invoices sent to all customers with valid email addresses",
//       invoiceData,
//     });
//   } catch (error) {
//     console.error("Error fetching invoices by vendor ID:", error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };

const invoiceByVendorId = async (req, res) => {
  try {
    const vendorId = req.user._id;
    const deliverNotes = await DeliverNote.find({ vendorId })
      .populate("customerId")
      .populate("orderId");

    if (!deliverNotes || deliverNotes.length === 0) {
      return res
        .status(404)
        .json({ message: "No deliver notes found for this vendor" });
    }

    const vendor = await venderModel.findById(vendorId);

    const invoiceData = deliverNotes.map((note) => ({
      id: note._id,
      brandLogo: vendor.brandLogo,
      orderId: note.orderId ? note.orderId.orderId : null,
      deliveryDate: note.orderId
        ? moment(note.orderId.deliveryDate).format("lll")
        : null,
      deliveryAddress: note.orderId ? note.orderId.deliveryAddress1 : null,
      customerName: note.customerId ? note.customerId.name : null,
      customerEmail: note.customerId ? note.customerId.email : null,
      products: note.products,
      totalPrice: note.products.reduce(
        (acc, item) => acc + item.price * item.quantity,
        0
      ),
    }));

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "parshotamrughanii@gmail.com",
        pass: "walz hskf huzy yljv", // Use App Password for better security
      },
    });

    await Promise.all(
      invoiceData.map(async (invoice) => {
        const customerEmail = invoice.customerEmail;
        if (customerEmail) {
          // Read and compile the Handlebars template

          const templatePath = path.join(__dirname, "invoice.html");
          const templateHtml = fs.readFileSync(templatePath, "utf8");
          const template = Handlebars.compile(templateHtml);

          // Create HTML content by passing data to the template
          const htmlContent = template({
            brandLogo: invoice.brandLogo,
            invoiceDate: new Date().toLocaleDateString(),
            invoiceNumber: invoice.id,
            deliveryAddress: invoice.deliveryAddress,
            customerName: invoice.customerName,
            customerEmail: invoice.customerEmail,
            orderId: invoice.orderId,
            deliveryDate: invoice.deliveryDate,
            products: invoice.products.map((product) => ({
              productName: product.productName,
              quantity: product.quantity,
              type: product.type,
              price: product.price,
              total: (product.price * product.quantity).toFixed(2),
            })),
            totalPrice: invoice.totalPrice.toFixed(2),
          });

          const pdfBuffer = await createPdf(htmlContent); // Call the Playwright-based PDF generation function

          const mailOptions = {
            from: "parshotamrughanii@gmail.com",
            to: customerEmail,
            subject: "Invoice Details",
            text: `Dear ${invoice.customerName}, please find the invoice details attached.`,
            attachments: [
              {
                filename: `invoice_${invoice.id}.pdf`,
                content: pdfBuffer,
                contentType: "application/pdf",
              },
            ],
          };

          try {
            await transporter.sendMail(mailOptions);
            console.log(`Email sent to ${customerEmail}`);
          } catch (error) {
            console.error(`Error sending email to ${customerEmail}:`, error);
          }
        }
      })
    );

    res.status(200).json({
      message: "Invoices sent to all customers with valid email addresses",
      invoiceData,
    });
  } catch (error) {
    console.error("Error fetching invoices by vendor ID:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const createPdf = async (html) => {
  const browser = await chromium.launch(); // Use Playwright to launch Chromium
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle" });
  const pdfBuffer = await page.pdf({ format: "A4" });
  await browser.close();
  return pdfBuffer;
};

//exports
module.exports = {
  getOrder,
  createOrder,
  updateOrder,
  getAllOrders,
  getOrderProduct,
  addProductInOrder,
  updateOrderProduct,
  deleteCustomerOrder,
  allocateOrderProducts,
  deleteProductFromOrder,
  generateOrderInvoice,
  bookOrderInvoice,
  orderBookIn,
  orderBookOut,
  generateOrderNote,
  invoicePDF,
  invoiceByVendorId,
};
