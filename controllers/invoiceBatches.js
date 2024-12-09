const moment = require("moment/moment");
const invoiceBatches = require("../models/invoiceBatches");
const Order = require("../models/orderModel");
const Document = require("../models/documentNumber");
const nodemailer = require("nodemailer"); // Require nodemailer
const { chromium } = require("playwright");
const QuickBooks = require("node-quickbooks");
const Quickbook = require("../models/quickbookAuth");

const Customer = require("../models/customers");
const htmlPdf = require("html-pdf");
const puppeteer = require("puppeteer");
const fs = require("fs");
const Handlebars = require("handlebars");
const path = require("path");

// function getDueDate(daysToAdd) {
//   let dueDate = new Date();
//   dueDate.setDate(dueDate.getDate() + daysToAdd);
//   return dueDate.toISOString().split("T")[0];
// }
const {
  countDaysBetween,
  countWeekdaysBetweenDates,
  calculateProductPrice,
  percetageCalculate,
  getDueDate,
} = require("../utiles/helper");
const venderModel = require("../models/venderModel");

const generateAlphanumericId = async (vendorId, type = "Order") => {
  const document = await Document.findOne({ name: type, vendorId });
  const uniqueId =
    document.code + "-" + (document.seed + document.counter).toString();

  return uniqueId;
};

const generateInvoiceBatchNumber = async (req, res) => {
  const vendorId = req.user;
  console.log(req.user, "udddd");
  const {
    name,
    description,
    invoiceRunCode,
    invoiceStartDate,
    invoiceUptoDate,
  } = req.body;
  if (!vendorId) {
    return res.status(404).json({ message: "Vendor not found" });
  }

  try {
    const orders = await Order.find({
      vendorId: vendorId,
      "products.status": "onrent",
      chargingStartDate: {
        // $gte: new Date(invoiceStartDate),
        $lte: new Date(invoiceUptoDate),
      },
    })
      .populate(
        invoiceRunCode == ""
          ? ""
          : {
              path: "invoiceRunCode",
              match: { code: invoiceRunCode },
            }
      )
      .populate(["customerId", "products.product", "paymentTerm"]);

    const vender = await venderModel.findById(vendorId);
    const batches = await invoiceBatches.find({ vendorId }).lean();

    const filteredInvoices = batches.filter(Boolean).flatMap((batch) =>
      batch.invoices.map((invoice) => ({
        ...invoice,
        batchId: batch._id,
      }))
    );
    const customerInvoices = filteredInvoices.filter(
      (invoice) => invoice.orderId
    );

    const isInvoiceExist = customerInvoices.map((item) => item.orderId);
    const sortedData = orders.filter((item) => item.invoiceInBatch === 0);

    for (const orderItem of sortedData) {
      try {
        console.log("Processing order:", orderItem);
        const result = await Order.updateOne(
          { _id: orderItem._id, vendorId: orderItem.vendorId },
          { $set: { invoiceInBatch: 1 } }
        );
        console.log("Update Result:", result);
      } catch (err) {
        console.error("Error updating order:", orderItem._id, err);
      }
    }

    const filteredOrders = sortedData.filter((order) => order.invoiceRunCode);
    console.log(filteredOrders, "filteredOrders");
    if (!filteredOrders.length) {
      return res.status(404).json({ message: "No matching invocies found" });
    }
    const allInvoice = orders
      .filter((item) => item.invoiceInBatch == 0)
      .map((element) => {
        const chargingStart = element.chargingStartDate;
        const bookDateStart = new Date(invoiceUptoDate);
        const daysCount = countWeekdaysBetweenDates(
          chargingStart,
          bookDateStart
        );
        const totalDaysCount = countDaysBetween(chargingStart, bookDateStart);
        const productData = element.products
          .filter((item) => item.status === "onrent")
          .map((item) => {
            const days = [
              Number(item.Day1),
              Number(item.Day2),
              Number(item.Day3),
              Number(item.Day4),
              Number(item.Day5),
              Number(item.Day6),
            ];

            const daysInWeek = Number(item?.rentalDaysPerWeek);
            const minimumRentailPeriod = 1; // Number(item?.minimumRentalPeriod);
            const productTotalPrice = calculateProductPrice(
              item?.price,
              daysCount,
              totalDaysCount,
              days,
              daysInWeek,
              minimumRentailPeriod
            ).totalPrice;
            const fullWeeks = calculateProductPrice(
              item?.price,
              daysCount,
              totalDaysCount,
              days,
              daysInWeek,
              minimumRentailPeriod
            ).fullWeeks;
            const remainingDays = calculateProductPrice(
              item?.price,
              daysCount,
              totalDaysCount,
              days,
              daysInWeek,
              minimumRentailPeriod
            ).remainingDays;
            return {
              productName: item.product.productName,
              quantity: item.quantity,
              type: item.status,
              weeks: fullWeeks,
              days: remainingDays,
              vat: item.taxRate,
              price: item.price,
              minimumRentalPeriod: minimumRentailPeriod,
              vatTotal:
                item.type === "Sale"
                  ? Number(item.quantity * item.price)
                  : Number((item.quantity * productTotalPrice).toFixed(2)),
              total:
                item.type === "Sale"
                  ? percetageCalculate(
                      item.taxRate,
                      Number(item.quantity * item.price)
                    )
                  : percetageCalculate(
                      item.taxRate,
                      Number((item.quantity * productTotalPrice).toFixed(2))
                    ),
            };
          });

        // Calculate the sum of vatTotal for each product in the current order
        const goods = productData
          .reduce((acc, product) => acc + product.vatTotal, 0)
          .toFixed(2);
        const total = productData.reduce(
          (acc, product) => acc + product.total,
          0
        );
        console.log(element);
        return {
          id: element._id,
          brandLogo: vender.brandLogo,
          invoiceDate: moment(element.bookDate).format("l"),
          invoiceUptoDate: moment(invoiceUptoDate).format("l"),
          // invoiceNumber: deliveryData.deliveryNote || deliveryData.returnNote,
          deliveryAddress: element.deliveryAddress1,
          customerName: element.billingPlaceName,
          customerAddress: element.address1,
          customerAddress2: element.address2,
          customerId: element.customerId.customerID,
          customer_id: element.customerId._id,
          paymentTerms: element.paymentTerm.days,
          customerCity: element.city,
          customerCountry: element.country,
          // customerPostCode: element.postCode,
          customerEmail: element.customerId.email,
          orderId: element.orderId,
          // collectionChargeAmount: collectionChargeAmount,
          // orderType: deliveryData.deliveryNote,
          orderNumber: element._id,
          deliveryDate: moment(element.deliveryDate).format("lll"),
          orderDate: moment(element.orderDate).format("lll"),
          deliveryPlaceName: element.city,
          invoiceDate: moment().format("LLLL"),
          product: productData,
          goods,
          total,
          tax: Number(total - goods).toFixed(2),
          invocie: "Draft",
          billingPlaceName: element.billingPlaceName,
          status: "Draft",
        };
      });

    const filterData = filteredOrders.map((element) => {
      const chargingStart = element.chargingStartDate;
      const bookDateStart = new Date(invoiceUptoDate);
      const daysCount = countWeekdaysBetweenDates(chargingStart, bookDateStart);
      const totalDaysCount = countDaysBetween(chargingStart, bookDateStart);

      return {
        id: element._id,
        // chargingStartDate: element.chargingStartDate,
        // totalDaysCount: totalDaysCount,
        // daysCount: daysCount,
        product: element.products
          .filter((item) => item.status === "onrent")
          .map((item) => {
            const days = [
              Number(item.Day1),
              Number(item.Day2),
              Number(item.Day3),
              Number(item.Day4),
              Number(item.Day5),
              Number(item.Day6),
            ];

            const daysInWeek = Number(item?.rentalDaysPerWeek);
            const minimumRentailPeriod = 1; // Number(item?.minimumRentalPeriod);
            const productTotalPrice = calculateProductPrice(
              item?.price,
              daysCount,
              totalDaysCount,
              days,
              daysInWeek,
              minimumRentailPeriod
            ).totalPrice;
            const fullWeeks = calculateProductPrice(
              item?.price,
              daysCount,
              totalDaysCount,
              days,
              daysInWeek,
              minimumRentailPeriod
            ).fullWeeks;
            const remainingDays = calculateProductPrice(
              item?.price,
              daysCount,
              totalDaysCount,
              days,
              daysInWeek,
              minimumRentailPeriod
            ).remainingDays;

            return {
              productName: item.productName,
              quantity: item.quantity,
              type: item.status,
              weeks: fullWeeks,
              days: remainingDays,
              vat: item.taxRate,
              price: item.price,
              minimumRentalPeriod: minimumRentailPeriod,
              vatTotal:
                item.type == "Sale"
                  ? Number(item.quantity * item.price)
                  : Number((item.quantity * productTotalPrice).toFixed(2)),
              total:
                item.type == "Sale"
                  ? percetageCalculate(
                      item.taxRate,
                      Number(item.quantity * item.price)
                    )
                  : percetageCalculate(
                      item.taxRate,
                      Number((item.quantity * productTotalPrice).toFixed(2))
                    ),
            };
          }),
      };
    });
    let totalPrice = 0;
    filterData.filter((order) => {
      const orderTotal = order.product.reduce(
        (sum, item) => sum + item.total,
        0
      );
      totalPrice += orderTotal;
    });

    let excluldingTaxTotal = 0;
    filterData.filter((order) => {
      const orderTotal = order.product.reduce(
        (sum, item) => sum + item.vatTotal,
        0
      );
      excluldingTaxTotal += orderTotal;
    });

    const ids = filteredOrders.map((item) => item._id);
    const totalInvoice = filteredOrders.length;
    const batchNumber = await generateAlphanumericId(vendorId, "Batch Number");

    await Document.findOneAndUpdate(
      { name: "Batch Number", vendorId: vendorId },
      { $inc: { counter: 1 } },
      { new: true }
    );
    const data = new invoiceBatches({
      vendorId: vendorId,
      name: name,
      description,
      invoiceStartDate,
      invoiceUptoDate,
      batchNumber,
      batchDate: moment().format("LLLL"),
      totalInvoice,
      orders: ids,
      invoices: allInvoice,
      totalPrice,
      excludingTax: excluldingTaxTotal,
      tax: (totalPrice - excluldingTaxTotal).toFixed(2),
    });
    await data.save();

    if (!totalInvoice) {
      return res
        .status(404)
        .json({ message: "No matching Invoice found", totalInvoice });
    }

    res.status(200).json({
      success: true,
      message: "Invoice run was successfully started.",
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Error retrieving Invoice", error });
  }
};

// ***************************get all invoice batch number*******************************
const getAllInvoiveBatches = async (req, res) => {
  try {
    const { _id: vendorId } = req.user;
    const { page = 1, limit = 10, search = "" } = req.query;

    if (!vendorId) {
      return res.status(400).json({ message: "Vendor ID is required." });
    }

    const pageNumber = parseInt(page, 10);
    const pageSize = parseInt(limit, 10);
    const skip = (pageNumber - 1) * pageSize;

    const searchFilter = search
      ? {
          $or: [
            { name: { $regex: search, $options: "i" } },
            { description: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    const invoiceList = await invoiceBatches
      .find({ vendorId, ...searchFilter })
      .skip(skip)
      .limit(pageSize)
      .sort({ createdAt: -1 });

    const totalRecords = await invoiceBatches.countDocuments({
      vendorId,
      ...searchFilter,
    });

    res.status(200).json({
      success: true,
      data: invoiceList,
      totalRecords,
      currentPage: pageNumber,
      totalPages: Math.ceil(totalRecords / pageSize),
    });
  } catch (error) {
    console.error("Error retrieving Invoice Batch:", error);
    res.status(500).json({ message: "Error retrieving Invoice Batch", error });
  }
};

// ***************************get Invoice Batch*******************************
// const getInvocieBatchById = async (req, res) => {
//   const { _id: vendorId } = req.user;

//   try {
//     if (!vendorId) {
//       return res.status(400).json({ message: "Vendor ID is required." });
//     }

//     const invoiceData = await invoiceBatches
//       .findById(req.params.id)
//       .populate("orders");

//     if (!invoiceData) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Invoice Batch not found" });
//     }

//     const filterData = invoiceData.orders.map((element) => {
//       const chargingStart = element.chargingStartDate;
//       const bookDateStart = new Date(invoiceData.invoiceUptoDate);
//       const daysCount = countWeekdaysBetweenDates(chargingStart, bookDateStart);
//       const totalDaysCount = countDaysBetween(chargingStart, bookDateStart);
//       console.log({ daysCount, totalDaysCount });

//       return {
//         id: element._id,
//         // chargingStartDate: element.chargingStartDate,
//         // totalDaysCount: totalDaysCount,
//         // daysCount: daysCount,
//         product: element.products
//           .filter((item) => item.status === "onrent")
//           .map((item) => {
//             const days = [
//               Number(item.Day1),
//               Number(item.Day2),
//               Number(item.Day3),
//               Number(item.Day4),
//               Number(item.Day5),
//               Number(item.Day6),
//             ];

//             const daysInWeek = Number(item?.rentalDaysPerWeek);
//             const minimumRentailPeriod = Number(item?.minimumRentalPeriod);
//             const productTotalPrice = calculateProductPrice(
//               item?.price,
//               daysCount,
//               totalDaysCount,
//               days,
//               daysInWeek,
//               minimumRentailPeriod
//             ).totalPrice;
//             const fullWeeks = calculateProductPrice(
//               item?.price,
//               daysCount,
//               totalDaysCount,
//               days,
//               daysInWeek,
//               minimumRentailPeriod
//             ).fullWeeks;
//             const remainingDays = calculateProductPrice(
//               item?.price,
//               daysCount,
//               totalDaysCount,
//               days,
//               daysInWeek,
//               minimumRentailPeriod
//             ).remainingDays;

//             return {
//               // productName: item.productName,
//               // quantity: item.quantity,
//               // type: item.status,
//               // weeks: fullWeeks,
//               // days: remainingDays,
//               // vat: item.taxRate,
//               // price: item.price,
//               // minimumRentalPeriod: minimumRentailPeriod,
//               vatTotal:
//                 item.type == "Sale"
//                   ? Number(item.quantity * item.price)
//                   : Number((item.quantity * productTotalPrice).toFixed(2)),
//               total:
//                 item.type == "Sale"
//                   ? percetageCalculate(
//                       item.taxRate,
//                       Number(item.quantity * item.price)
//                     )
//                   : percetageCalculate(
//                       item.taxRate,
//                       Number((item.quantity * productTotalPrice).toFixed(2))
//                     ),
//             };
//           }),
//         sumVatTotal: 0,
//       };
//     });

//     res.status(200).json({
//       success: true,
//       message: "Data retrive successfully",
//       filterData,
//       // data: invoiceData,
//     });
//   } catch (error) {
//     res.status(500).json({ success: false, error: error.message });
//   }
// };
const getInvocieBatchById = async (req, res) => {
  const { _id: vendorId } = req.user;

  try {
    if (!vendorId) {
      return res.status(400).json({ message: "Vendor ID is required." });
    }

    const invoiceData = await invoiceBatches.findById(req.params.id).populate({
      path: "orders",
      populate: [{ path: "products.product" }, { path: "customerId" }],
    });
    if (!invoiceData) {
      return res
        .status(404)
        .json({ success: false, message: "Invoice Batch not found" });
    }

    const filterData = invoiceData.orders.map((element) => {
      const chargingStart = element.chargingStartDate;
      const bookDateStart = new Date(invoiceData.invoiceUptoDate);
      const daysCount = countWeekdaysBetweenDates(chargingStart, bookDateStart);
      const totalDaysCount = countDaysBetween(chargingStart, bookDateStart);

      const productData = element.products
        .filter((item) => item.status === "onrent")
        .map((item) => {
          const days = [
            Number(item.Day1),
            Number(item.Day2),
            Number(item.Day3),
            Number(item.Day4),
            Number(item.Day5),
            Number(item.Day6),
          ];

          const daysInWeek = Number(item?.rentalDaysPerWeek);
          const minimumRentailPeriod = Number(item?.minimumRentalPeriod);
          const productTotalPrice = calculateProductPrice(
            item?.price,
            daysCount,
            totalDaysCount,
            days,
            daysInWeek,
            minimumRentailPeriod
          ).totalPrice;
          const fullWeeks = calculateProductPrice(
            item?.price,
            daysCount,
            totalDaysCount,
            days,
            daysInWeek,
            minimumRentailPeriod
          ).fullWeeks;
          const remainingDays = calculateProductPrice(
            item?.price,
            daysCount,
            totalDaysCount,
            days,
            daysInWeek,
            minimumRentailPeriod
          ).remainingDays;
          return {
            productName: item.product.productName,
            quantity: item.quantity,
            type: item.status,
            weeks: fullWeeks,
            days: remainingDays,
            vat: item.taxRate,
            price: item.price,
            minimumRentalPeriod: minimumRentailPeriod,
            vatTotal:
              item.type === "Sale"
                ? Number(item.quantity * item.price)
                : Number((item.quantity * productTotalPrice).toFixed(2)),
            total:
              item.type === "Sale"
                ? percetageCalculate(
                    item.taxRate,
                    Number(item.quantity * item.price)
                  )
                : percetageCalculate(
                    item.taxRate,
                    Number((item.quantity * productTotalPrice).toFixed(2))
                  ),
          };
        });

      // Calculate the sum of vatTotal for each product in the current order
      const goods = productData
        .reduce((acc, product) => acc + product.vatTotal, 0)
        .toFixed(2);
      const total = productData.reduce(
        (acc, product) => acc + product.total,
        0
      );

      return {
        id: element._id,
        // brandLogo: vender.brandLogo,
        invoiceDate: moment(element.bookDate).format("l"),
        // invoiceNumber: deliveryData.deliveryNote || deliveryData.returnNote,
        deliveryAddress: element.deliveryAddress1,
        customerName: element.billingPlaceName,
        customerAddress: element.address1,
        customerAddress2: element.address2,
        customerCity: element.city,
        customerId: element.customerId,
        customer_id: element.customer_id,
        paymentTerms: element.paymentTerms,
        customerCountry: element.country,
        // customerPostCode: element.postCode,
        customerEmail: element.customerId.email,
        orderId: element.orderId,
        // collectionChargeAmount: collectionChargeAmount,
        // orderType: deliveryData.deliveryNote,
        orderNumber: element.orderId,
        deliveryDate: moment(element.deliveryDate).format("lll"),
        orderDate: moment(element.orderDate).format("lll"),
        deliveryPlaceName: element.city,
        invoiceDate: invoiceData.batchDate,
        product: productData,
        goods,
        total,
        tax: Number(total - goods).toFixed(2),
        invocie: invoiceData.status,
        billingPlaceName: element.billingPlaceName,
        status: invoiceData.status,
      };
    });
    res.status(200).json({
      success: true,
      message: "Data retrieved successfully",
      data: {
        _id: invoiceData._id,
        name: invoiceData.name,
        description: invoiceData.description,
        batchDate: invoiceData.batchDate,
        invoiceStartDate: invoiceData.invoiceStartDate,
        invoiceUptoDate: invoiceData.invoiceUptoDate,
        batchNumber: invoiceData.batchNumber,
        totalInvoice: invoiceData.totalInvoice,
        totalPrice: invoiceData.totalPrice,
        excludingTax: invoiceData.excludingTax,
        tax: invoiceData.tax,
        // orders: filterData,
        invoices: invoiceData.invoices,
        status: invoiceData.status,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ***************************delete Invoice Batch*******************************
const deleteInvoiceBatchById = async (req, res) => {
  try {
    const InvoiceBatch = await invoiceBatches.findByIdAndDelete(req.params.id);
    if (!InvoiceBatch) {
      return res
        .status(404)
        .json({ success: false, message: "Invoice Batch not found" });
    }
    res
      .status(200)
      .json({ success: true, message: "Invoice Batch deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, error: error.message, message: error.message });
  }
};

const removeOrderFromInvoiceBatch = async (req, res) => {
  const { invoiceBatchId, orderId } = req.params;
  const { _id: vendorId } = req.user;

  try {
    // Find the invoice batch by ID and vendor ID to ensure ownership
    const invoiceBatch = await invoiceBatches.findOne({
      _id: invoiceBatchId,
      vendorId: vendorId,
    });

    if (!invoiceBatch) {
      return res
        .status(404)
        .json({ message: "Invoice batch not found or not authorized" });
    }

    // Update by pulling the order from the orders array
    const updatedInvoiceBatch = await invoiceBatches
      .findByIdAndUpdate(
        invoiceBatchId,
        { $pull: { orders: orderId } },
        { new: true }
      )
      .populate("orders");

    const filterData = updatedInvoiceBatch.orders.map((element) => {
      const chargingStart = element.chargingStartDate;
      const bookDateStart = new Date(invoiceBatch.invoiceUptoDate);
      const daysCount = countWeekdaysBetweenDates(chargingStart, bookDateStart);
      const totalDaysCount = countDaysBetween(chargingStart, bookDateStart);
      const productData = element.products
        .filter((item) => item.status === "onrent")
        .map((item) => {
          const days = [
            Number(item.Day1),
            Number(item.Day2),
            Number(item.Day3),
            Number(item.Day4),
            Number(item.Day5),
            Number(item.Day6),
          ];

          const daysInWeek = Number(item?.rentalDaysPerWeek);
          const minimumRentailPeriod = Number(item?.minimumRentalPeriod);
          const productTotalPrice = calculateProductPrice(
            item?.price,
            daysCount,
            totalDaysCount,
            days,
            daysInWeek,
            minimumRentailPeriod
          ).totalPrice;

          return {
            vatTotal:
              item.type === "Sale"
                ? Number(item.quantity * item.price)
                : Number((item.quantity * productTotalPrice).toFixed(2)),
            total:
              item.type === "Sale"
                ? percetageCalculate(
                    item.taxRate,
                    Number(item.quantity * item.price)
                  )
                : percetageCalculate(
                    item.taxRate,
                    Number((item.quantity * productTotalPrice).toFixed(2))
                  ),
          };
        });

      // Calculate the sum of vatTotal for each product in the current order
      const goods = productData.reduce(
        (acc, product) => acc + product.vatTotal,
        0
      );
      const total = productData.reduce(
        (acc, product) => acc + product.total,
        0
      );

      return {
        id: element._id,
        invoiceDate: updatedInvoiceBatch.batchDate,
        product: productData,
        goods,
        total,
        tax: total - goods,
        billingPlaceName: element.billingPlaceName,
      };
    });
    const filterdataa = filterData;

    invoiceBatch.totalInvoice = updatedInvoiceBatch.orders.length;
    invoiceBatch.totalPrice = filterdataa.total;
    invoiceBatch.tax = filterdataa.tax;
    invoiceBatch.excludingTax = filterdataa.total - filterdataa.tax;
    await invoiceBatch.save();
    res.status(200).json({
      message: "Order removed successfully from invoice batch",
      data: updatedInvoiceBatch,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "An error occurred while removing the order",
      error,
    });
  }
};

const getInvoiceById = async (req, res) => {
  const { _id: vendorId } = req.user;
  try {
    const { id, invoiceId } = req.body;

    const invoiceBatch = await invoiceBatches.findById(id).populate({
      path: "orders",
      populate: [{ path: "products.product" }, { path: "customerId" }],
    });

    if (!invoiceBatch) {
      return res.status(404).json({ message: "Invoice Batch not found" });
    }

    const filterInvoice = invoiceBatch.invoices.filter(
      (item) => item._id == invoiceId
    );
    if (!filterInvoice[0]) {
      return res
        .status(404)
        .json({ success: false, message: "Invoice not found in this batch" });
    }

    res.status(200).json({
      success: true,
      data: filterInvoice[0],
      message: "Data retrive successfully!",
    });
  } catch (error) {
    console.error("Error fetching invoice by batch and invoice ID:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
const createPdf = async (html) => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle" });
  const pdfBuffer = await page.pdf({ format: "A4" });
  await browser.close();
  return pdfBuffer;
};
// post sigle invoice
const postSingleInvoice = async (req, res) => {
  const { _id: vendorId } = req.user;

  try {
    const { id, invoiceId } = req.body;

    const invoiceBatch = await invoiceBatches.findById(id).populate({
      path: "orders",
      populate: [{ path: "products.product" }, { path: "customerId" }],
    });

    if (!invoiceBatch) {
      return res.status(404).json({ message: "Invoice Batch not found" });
    }
    const checkInvoiceStatus = invoiceBatch?.invoices?.filter(
      (item) => item._id == invoiceId
    );
    for (const orderItem of checkInvoiceStatus) {
      try {
        console.log("Processing order:", orderItem);
        const result = await Order.updateOne(
          { _id: orderItem.id, vendorId: vendorId },
          { $set: { invoiceInBatch: 0 } }
        );
        console.log("Update Result:", result);
      } catch (err) {
        console.error("Error updating order:", orderItem._id, err);
      }
    }
    const matchStatus = checkInvoiceStatus[0]?.status;
    if (matchStatus == "Draft") {
      const batchNumber = await generateAlphanumericId(vendorId, "Invoice");
      await Document.findOneAndUpdate(
        { name: "Invoice", vendorId: vendorId },
        { $inc: { counter: 1 } },
        { new: true }
      );

      const result = await invoiceBatches.findOneAndUpdate(
        {
          _id: id,
          "invoices._id": invoiceId,
        },
        {
          $set: {
            "invoices.$.status": "Posted",
            "invoices.$.invocie": batchNumber,
          },
        },
        { new: true }
      );

      if (!result) {
        return { success: false, message: "InvoiceBatch or Order not found" };
      }
    } else {
      const result = await invoiceBatches.findOneAndUpdate(
        {
          _id: id,
          "invoices._id": invoiceId,
        },
        {
          $set: { "invoices.$.status": "Posted" },
        },
        { new: true }
      );

      if (!result) {
        return { success: false, message: "InvoiceBatch or Order not found" };
      }
    }

    const filterInvoice = invoiceBatch.invoices.filter(
      (item) => item._id == invoiceId
    );
    if (!filterInvoice[0]) {
      return res
        .status(404)
        .json({ success: false, message: "Invoice not found in this batch" });
    }
    const vender = await venderModel.findById(vendorId);
    const isQuickBookAccountExist = vender.isQuickBook;
    const invoiceDetail = filterInvoice[0];

    const invoice = {
      Line: invoiceDetail.product.map((item) => ({
        Description: item.productName,
        Amount: item.total,
        DetailType: "SalesItemLineDetail",
        SalesItemLineDetail: {
          UnitPrice: item.vattotalPrice,
          Qty: item.quantity,
        },
      })),
      CustomerRef: {
        value: `${invoiceDetail.customerId}`,
        name: invoiceDetail.customerName,
      },
      BillEmail: {
        Address: invoiceDetail.customerEmail, // Customer's email
      },
      BillAddr: {
        Line1: invoiceDetail.customerAddress,
        City: invoiceDetail.customerCity,
        PostalCode: invoiceDetail.customerCountry,
      },
      SalesTermRef: {
        value: "1",
      },
      DueDate: getDueDate(Number(invoiceDetail.paymentTerms)),
      TotalAmt: invoiceDetail.vattotalPrice,
    };
    const existingRecord = await Quickbook.findOne({ vendorId });
    console.log({ existingRecord });

    const invoiceData = {
      brandLogo: vender.brandLogo,
      invoiceDate: invoiceDetail.invoiceDate,
      invoiceNumber: invoiceDetail.invocie,
      deliveryAddress: invoiceDetail.deliveryAddress,
      customerName: invoiceDetail.customerName,
      customerAddress: invoiceDetail.customerAddress,
      customerCity: invoiceDetail.customerCity,
      customerCountry: invoiceDetail.customerCountry,
      customerPostCode: "",
      // collectionChargeAmount:
      //   collectionChargeAmount != 0
      //     ? `A delivery fee of $${collectionChargeAmount} may apply, based on your location and order details.`
      //     : "",
      // collectionCharge:
      //   collectionChargeAmount != 0
      //     ? `A collection fee of $${collectionChargeAmount} may apply, based on your location and order details.`
      //     : "",
      customerEmail: invoiceDetail.customerEmail,
      orderId: invoiceDetail.orderId,
      orderType: "invoiceDetail.deliveryNote",
      orderNumber: invoiceDetail.orderNumber,
      deliveryDate: invoiceDetail.deliveryDate,
      orderDate: invoiceDetail.orderDate,
      deliveryPlaceName: invoiceDetail.deliveryPlaceName,
      products: invoiceDetail.product.map((item) => {
        return {
          productName: item.productName,
          quantity: item.quantity,
          type: item.type,
          days: item.days,
          weeks: item.weeks,
          minimumRentalPeriod: item.minimumRentalPeriod,
          price: item.price,
          vat: item.vat,
          total: item.total,
        };
      }),
      vattotalPrice: invoiceDetail.total,
      totalPrice: invoiceDetail.goods,
      vatTotal: invoiceDetail.tax,
    };

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "parshotamrughanii@gmail.com",
        pass: "walz hskf huzy yljv",
      },
    });

    const templatePath = path.join(__dirname, "invoice.html");
    const templateHtml = fs.readFileSync(templatePath, "utf8");
    const template = Handlebars.compile(templateHtml);

    const htmlContent = template(invoiceData);

    const pdfBuffer = await createPdf(htmlContent);

    const mailOptions = {
      from: "parshotamrughanii@gmail.com",
      to: invoiceData.customerEmail,
      subject: "Invoice Details",
      text: `Dear ${invoiceData.customerEmail}, please find the invoice details attached.`,
      attachments: [
        {
          filename: `invoice_${invoiceData.invoiceNumber}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    };

    await transporter.sendMail(mailOptions);

    // res.status(200).json({
    //   message: "Invoice Posted successfully!",
    //   success: true,
    // });
    if (existingRecord != null) {
      const qbo = new QuickBooks(
        process.env.CLIENT_ID,
        process.env.CLIENT_SECRET,
        existingRecord.accessToken,
        false,
        existingRecord.realmId,
        true,
        true,
        existingRecord.refreshToken,
        "2.0"
      );
      if (isQuickBookAccountExist) {
        if (invoiceDetail.customerId != 0) {
          qbo.createInvoice(invoice, async function (err, invoice) {
            if (err) {
              return res.send({
                message: "AUTHENTICATION",
              });
            } else {
              await invoiceBatches.updateOne(
                { _id: id, "invoices._id": invoiceId },
                { $set: { "invoices.$.DocNumber": invoice.DocNumber } }
              );
              return res.status(200).json({
                message: "Invoice Posted successfully!",
                success: true,
              });
            }
          });
        }
      }
    } else {
      return res.status(200).json({
        message: "Invoice Posted successfully!",
        success: true,
      });
    }
  } catch (error) {
    console.error("Error fetching invoices by vendor ID:", error);
    res.status(500).json({ message: "Internal server error", error: error });
  }
};
const postMulipleInvoice = async (req, res) => {
  const { _id: vendorId } = req.user;

  try {
    const { id } = req.body;

    // Find the invoice batch
    const invoiceBatch = await invoiceBatches.findById(id).populate({
      path: "orders",
      populate: [{ path: "products.product" }, { path: "customerId" }],
    });

    if (!invoiceBatch) {
      return res.status(404).json({ message: "Invoice Batch not found" });
    }

    // Check invoice status
    const invoiceStatus = await invoiceBatches.findOne({
      vendorId,
      _id: id,
    });

    if (!invoiceStatus) {
      return res
        .status(404)
        .json({ success: false, message: "Invoice Batch not found" });
    }

    // Process draft or confirmed invoices
    const draftInvoices = invoiceStatus.invoices.filter(
      (item) => item.status === "Draft" || item.status === "Confirmed"
    );

    for (const invoice of draftInvoices) {
      // Reset invoiceInBatch for associated orders
      await Order.updateOne(
        { _id: invoice.id, vendorId },
        { $set: { invoiceInBatch: 0 } }
      );

      // Update invoice status and assign a batch number for drafts
      if (invoice.status === "Draft") {
        const batchNumber = await generateAlphanumericId(vendorId, "Invoice");
        await Document.findOneAndUpdate(
          { name: "Invoice", vendorId },
          { $inc: { counter: 1 } },
          { new: true }
        );
        invoice.invocie = batchNumber;
      }
      invoice.status = "Posted";
    }

    // Update batch status
    invoiceStatus.status = "Posted";
    await invoiceStatus.save();

    // Email and QuickBooks processing
    const vendor = await venderModel.findById(vendorId);
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "parshotamrughanii@gmail.com",
        pass: process.env.EMAIL_PASSWORD, // Use environment variables for sensitive data
      },
    });

    const existingRecord = await Quickbook.findOne({ vendorId });
    const invoicesToPost = invoiceBatch.invoices;

    for (const invoice of invoicesToPost) {
      const customerEmail = invoice.customerEmail;
      if (customerEmail) {
        try {
          const templatePath = path.join(__dirname, "invoicePrint.html");
          const templateHtml = fs.readFileSync(templatePath, "utf8");
          const template = Handlebars.compile(templateHtml);

          const invoiceData = {
            brandLogo: vendor.brandLogo,
            invoiceDate: invoice.invoiceDate,
            invoiceNumber: invoice.invocie,
            products: invoice.product.map((item) => ({
              productName: item.productName,
              quantity: item.quantity,
              price: item.price,
              total: item.total,
            })),
            totalPrice: invoice.total,
          };

          const htmlContent = template(invoiceData);
          const pdfBuffer = await createPdf(htmlContent);

          const mailOptions = {
            from: "parshotamrughanii@gmail.com",
            to: customerEmail,
            subject: "Invoice Details",
            text: `Dear ${invoice.customerName}, please find the attached invoice.`,
            attachments: [
              {
                filename: `invoice_${invoice.invoiceNumber}.pdf`,
                content: pdfBuffer,
                contentType: "application/pdf",
              },
            ],
          };

          await transporter.sendMail(mailOptions);
        } catch (error) {
          console.error(`Error sending email to ${customerEmail}:`, error);
        }
      }

      if (existingRecord) {
        const qbo = new QuickBooks(
          process.env.CLIENT_ID,
          process.env.CLIENT_SECRET,
          existingRecord.accessToken,
          false,
          existingRecord.realmId,
          true,
          true,
          existingRecord.refreshToken,
          "2.0"
        );

        const invoicePost = {
          Line: invoice.product.map((item) => ({
            Description: item.productName,
            Amount: item.total,
            DetailType: "SalesItemLineDetail",
            SalesItemLineDetail: {
              UnitPrice: item.price,
              Qty: item.quantity,
            },
          })),
          CustomerRef: {
            value: invoice.customerId,
            name: invoice.customerName,
          },
          TotalAmt: invoice.total,
        };

        try {
          qbo.createInvoice(invoicePost, async (err, quickBookInvoice) => {
            if (!err) {
              await invoiceBatches.updateOne(
                { _id: id, "invoices.id": invoice.id },
                { $set: { "invoices.$.DocNumber": quickBookInvoice.DocNumber } }
              );
            } else {
              console.error("QuickBooks Error:", err);
            }
          });
        } catch (error) {
          console.error("QuickBooks API error:", error);
        }
      }
    }

    res.status(200).json({
      message: "Invoices processed and posted successfully!",
      success: true,
    });
  } catch (error) {
    console.error("Error processing invoices:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// const postMulipleInvoice = async (req, res) => {
//   const { _id: vendorId } = req.user;
//   try {
//     const { id } = req.body;

//     const invoiceBatch = await invoiceBatches.findById(id).populate({
//       path: "orders",
//       populate: [{ path: "products.product" }, { path: "customerId" }],
//     });

//     if (!invoiceBatch) {
//       return res.status(404).json({ message: "Invoice Batch not found" });
//     }
//     const invoiceStatus = await invoiceBatches.findById({ vendorId, _id: id });

//     if (!invoiceStatus) {
//       return res
//         .status(404)
//         .send({ success: false, message: "InvoiceBatch not found" });
//     }
//     const isDraftInvocie = invoiceStatus.invoices.filter(
//       (item) => item.status == "Draft" || item.status === "Confirmed"
//     );

//     for (const orderItem of isDraftInvocie) {
//       try {
//         console.log("Processing order:", orderItem);
//         const result = await Order.updateOne(
//           { _id: orderItem.id, vendorId: vendorId },
//           { $set: { invoiceInBatch: 0 } }
//         );
//         console.log("Update Result:", result);
//       } catch (err) {
//         console.error("Error updating order:", orderItem._id, err);
//       }
//     }
//     for await (let invoice of isDraftInvocie) {
//       if (invoice.status == "Draft") {
//         const batchNumber = await generateAlphanumericId(vendorId, "Invoice");

//         await Document.findOneAndUpdate(
//           { name: "Invoice", vendorId: vendorId },
//           { $inc: { counter: 1 } },
//           { new: true }
//         );
//         invoice.invocie = batchNumber;

//         invoice.status = "Posted";
//       } else {
//         invoice.status = "Posted";
//       }
//     }

//     //  else {
//     //   for (let invoice of invoiceStatus.invoices) {
//     //     invoice.status = "Posted";
//     //   }
//     // }
//     invoiceStatus.status = "Posted";
//     await invoiceStatus.save();
//     const vender = await venderModel.findById(vendorId);
//     const transporter = nodemailer.createTransport({
//       service: "gmail",
//       auth: {
//         user: "parshotamrughanii@gmail.com",
//         pass: "walz hskf huzy yljv",
//       },
//     });
//     const existingRecord = await Quickbook.findOne({ vendorId });

//     await Promise.all(
//       invoiceBatch.invoices.map(async (invoice) => {
//         const invoicePost = {
//           Line: invoice.product.map((item) => ({
//             Description: item.productName,
//             Amount: item.total,
//             DetailType: "SalesItemLineDetail",
//             SalesItemLineDetail: {
//               UnitPrice: item.vattotalPrice,
//               Qty: item.quantity,
//             },
//           })),
//           CustomerRef: {
//             value: `${invoice.customerId}`,
//             name: invoice.customerName,
//           },
//           BillEmail: {
//             Address: invoice.customerEmail, // Customer's email
//           },
//           BillAddr: {
//             Line1: invoice.customerAddress,
//             City: invoice.customerCity,
//             PostalCode: invoice.customerCountry,
//           },
//           SalesTermRef: {
//             value: "1",
//           },
//           DueDate: getDueDate(Number(invoice.paymentTerms)),
//           TotalAmt: invoice.vattotalPrice,
//         };
//         const customerEmail = invoice.customerEmail;
//         if (customerEmail) {
//           const templatePath = path.join(__dirname, "invoicePrint.html");
//           const templateHtml = fs.readFileSync(templatePath, "utf8");
//           const template = Handlebars.compile(templateHtml);
//           const invoiceData = {
//             brandLogo: vender.brandLogo,
//             invoiceDate: invoice.invoiceDate,
//             invoiceNumber: invoice.invocie,
//             deliveryAddress: invoice.deliveryAddress,
//             customerName: invoice.customerName,
//             customerAddress: invoice.customerAddress,
//             customerCity: invoice.customerCity,
//             customerCountry: invoice.customerCountry,
//             customerPostCode: "",
//             // collectionChargeAmount:
//             //   collectionChargeAmount != 0
//             //     ? `A delivery fee of $${collectionChargeAmount} may apply, based on your location and order details.`
//             //     : "",
//             // collectionCharge:
//             //   collectionChargeAmount != 0
//             //     ? `A collection fee of $${collectionChargeAmount} may apply, based on your location and order details.`
//             //     : "",
//             customerEmail: invoice.customerEmail,
//             orderId: invoice.orderId,
//             orderType: "invoice.deliveryNote",
//             orderNumber: invoice.orderNumber,
//             deliveryDate: invoice.deliveryDate,
//             orderDate: invoice.orderDate,
//             deliveryPlaceName: invoice.deliveryPlaceName,
//             products: invoice.product.map((item) => {
//               return {
//                 productName: item.productName,
//                 quantity: item.quantity,
//                 type: item.type,
//                 days: item.days,
//                 weeks: item.weeks,
//                 minimumRentalPeriod: item.minimumRentalPeriod,
//                 price: item.price,
//                 vat: item.vat,
//                 total: item.total,
//               };
//             }),
//             vattotalPrice: invoice.total,
//             totalPrice: invoice.goods,
//             vatTotal: invoice.tax,
//           };

//           const htmlContent = template(invoiceData);

//           const pdfBuffer = await createPdf(htmlContent);

//           const mailOptions = {
//             from: "parshotamrughanii@gmail.com",
//             to: invoiceData.customerEmail,
//             subject: "Invoice Details",
//             text: `Dear ${invoiceData.customerEmail}, please find the invoice details attached.`,
//             attachments: [
//               {
//                 filename: `invoice_${invoiceData.invoiceNumber}.pdf`,
//                 content: pdfBuffer,
//                 contentType: "application/pdf",
//               },
//             ],
//           };
//           if (existingRecord != null) {
//             const qbo = new QuickBooks(
//               process.env.CLIENT_ID,
//               process.env.CLIENT_SECRET,
//               existingRecord.accessToken,
//               false,
//               existingRecord.realmId,
//               true,
//               true,
//               existingRecord.refreshToken,
//               "2.0"
//             );

//             if (isQuickBookAccountExist) {
//               if (invoice.customerId != 0) {
//                 qbo.createInvoice(invoicePost, async function (err, invoices) {
//                   if (err) {
//                     return res.send({
//                       message: err,
//                     });
//                   } else {
//                     await invoiceBatches.updateOne(
//                       { _id: id, "invoices.id": invoice.id },
//                       { $set: { "invoices.$.DocNumber": invoices.DocNumber } }
//                     );
//                     // return res.status(200).json({
//                     //   message: "Invoice Posted and Save successfully!",
//                     //   success: true,
//                     // });
//                   }
//                 });
//               }
//             }
//           } else {
//             return res.status(200).json({
//               message: "Invoice Posted successfully!",
//               success: true,
//             });
//           }

//           try {
//             await transporter.sendMail(mailOptions);
//           } catch (error) {
//             console.error(`Error sending email to ${customerEmail}:`, error);
//           }
//         }
//       })
//     );

//     res.status(200).json({
//       message: "Invoice Posted successfully!",
//       success: true,
//     });
//   } catch (error) {
//     console.error("Error fetching invoices by vendor ID:", error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };

const confrimInvoiceBatchStatus = async (req, res) => {
  const { _id: vendorId } = req.user;

  const { id, status } = req.body;
  if (!id) {
    return res
      .status(404)
      .send({ success: false, message: "Id is not provided" });
  }
  if (!status) {
    return res
      .status(404)
      .send({ success: false, message: "Status field is empty!" });
  }
  try {
    const InvoiceBatch = await invoiceBatches.findById({ vendorId, _id: id });

    if (!InvoiceBatch) {
      return res
        .status(404)
        .send({ success: false, message: "InvoiceBatch not found" });
    }

    const isConfirmedInvoice = InvoiceBatch.invoices.filter(
      (item) => item.status != "Confirmed"
    );

    for await (let invoice of isConfirmedInvoice) {
      const batchNumber = await generateAlphanumericId(vendorId, "Invoice");

      await Document.findOneAndUpdate(
        { name: "Invoice", vendorId: vendorId },
        { $inc: { counter: 1 } },
        { new: true }
      );

      invoice.status = status;
      invoice.invocie = batchNumber;
    }

    InvoiceBatch.status = status;

    const confrimInvoiceBatchStatus = await InvoiceBatch.save();
    res.status(200).json({
      success: true,
      message: "Status change successfully!",
      confrimInvoiceBatchStatus,
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const confrimInvoice = async (req, res) => {
  try {
    const { _id: vendorId } = req.user;
    const batchNumber = await generateAlphanumericId(vendorId, "Invoice");

    const { id, invoiceId } = req.body;
    await Document.findOneAndUpdate(
      { name: "Invoice", vendorId: vendorId },
      { $inc: { counter: 1 } },
      { new: true }
    );
    await invoiceBatches.findOneAndUpdate(
      {
        _id: id,
        "invoices._id": invoiceId,
      },
      {
        $set: {
          "invoices.$.status": "Confirmed",
          "invoices.$.invocie": batchNumber,
        },
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Status change successfully!",
      confrimInvoiceBatchStatus,
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

//**********/ print invoice **********
const invoicePrint = async (req, res) => {
  const { _id: vendorId } = req.user;
  try {
    const { id, invoiceId } = req.body;
    const vender = await venderModel.findById(vendorId);

    const invoiceBatch = await invoiceBatches.findById(id).populate({
      path: "orders",
      populate: [{ path: "products.product" }, { path: "customerId" }],
    });

    if (!invoiceBatch) {
      return res.status(404).json({ message: "Invoice Batch not found" });
    }

    const filterInvoice = invoiceBatch.invoices.filter(
      (item) => item._id == invoiceId
    );
    if (!filterInvoice[0]) {
      return res
        .status(404)
        .json({ message: "Invoice not found in this batch" });
    }

    const invoiceDetail = filterInvoice[0];
    const invoiceData = {
      brandLogo: vender.brandLogo,
      invoiceDate: invoiceDetail.invoiceDate,
      invoiceNumber: invoiceDetail.invocie,
      deliveryAddress: invoiceDetail.deliveryAddress,
      customerName: invoiceDetail.customerName,
      customerAddress: invoiceDetail.customerAddress,
      customerCity: invoiceDetail.customerCity,
      customerCountry: invoiceDetail.customerCountry,
      customerPostCode: "",
      customerEmail: invoiceDetail.customerEmail,
      orderId: invoiceDetail.orderId,
      orderType: invoiceDetail.deliveryNote,
      orderNumber: invoiceDetail.orderNumber,
      deliveryDate: invoiceDetail.deliveryDate,
      orderDate: invoiceDetail.orderDate,
      deliveryPlaceName: invoiceDetail.deliveryPlaceName,
      products: (invoiceDetail.product || []).map((item) => ({
        productName: item.productName,
        quantity: item.quantity,
        type: item.type,
        days: item.days,
        weeks: item.weeks,
        minimumRentalPeriod: item.minimumRentalPeriod,
        price: item.price,
        vat: item.vat,
        total: item.total,
      })),
      vattotalPrice: invoiceDetail.total,
      totalPrice: invoiceDetail.goods,
      vatTotal: invoiceDetail.tax,
    };

    const templatePath = path.join(__dirname, "invoice.html");
    const templateHtml = fs.readFileSync(templatePath, "utf8");
    const template = Handlebars.compile(templateHtml);
    const html = template(invoiceData);

    let browser;
    try {
      browser = await puppeteer.launch({
        executablePath: "/snap/bin/chromium",
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "networkidle0" });

      let pathname = `${invoiceDetail.invocie}-${Date.now()}.pdf`;
      const pdfPath = path.join(
        __dirname.replace("/controllers", ""),
        "pdfs",
        pathname
      );
      await page.pdf({
        path: pdfPath,
        format: "A4",
        printBackground: true,
        scale: 0.8,
      });

      const baseUrl = `${req.protocol}://${req.get("host")}`;
      const pdfUrl = `${baseUrl}/pdfs/${pathname}`;
      res.json({ url: pdfUrl });

      // Schedule file deletion
      setTimeout(() => {
        fs.unlink(pdfPath, (err) => {
          if (err) console.error(`Failed to delete file: ${pdfPath}`, err);
          else console.log(`Successfully deleted file: ${pdfPath}`);
        });
      }, 60000);
    } finally {
      if (browser) await browser.close();
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error!" });
  }
};

const multipleInvoicePrint = async (req, res) => {
  const { _id: vendorId } = req.user;
  try {
    const { id } = req.body;
    const vendor = await venderModel.findById(vendorId);

    const invoiceBatch = await invoiceBatches.findById(id).populate({
      path: "orders",
      populate: [{ path: "products.product" }, { path: "customerId" }],
    });

    if (!invoiceBatch) {
      return res.status(404).json({ message: "Invoice Batch not found" });
    }

    const invoiceData = invoiceBatch.invoices.map((item) => ({
      brandLogo: vendor.brandLogo,
      invoiceDate: item.invoiceDate,
      invoiceNumber: item.invocie,
      deliveryAddress: item.deliveryAddress,
      customerName: item.customerName,
      customerAddress: item.customerAddress,
      customerCity: item.customerCity,
      customerCountry: item.customerCountry,
      customerPostCode: "",
      customerEmail: item.customerEmail,
      orderId: item.orderId,
      orderType: "item.deliveryNote",
      orderNumber: item.orderNumber,
      deliveryDate: item.deliveryDate,
      orderDate: item.orderDate,
      deliveryPlaceName: item.deliveryPlaceName,
      products: item.product.map((product) => ({
        productName: product.productName,
        quantity: product.quantity,
        type: product.type,
        days: product.days,
        weeks: product.weeks,
        minimumRentalPeriod: product.minimumRentalPeriod,
        price: product.price,
        vat: product.vat,
        total: product.total,
      })),
      vattotalPrice: item.total,
      totalPrice: item.goods,
      vatTotal: item.tax,
    }));

    const templatePath = path.join(__dirname, "invoicePrint.html");
    const templateHtml = fs.readFileSync(templatePath, "utf8");
    const template = Handlebars.compile(templateHtml);

    const html = template({ invoices: invoiceData });

    const browser = await puppeteer.launch({
      executablePath: "/snap/bin/chromium",
      headless: false,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pathname = `Invoice-${invoiceBatch.batchNumber}-${moment(
      Date.now()
    ).format("LLLL")}.pdf`;
    const pdfPath = path.join(
      __dirname.replace("/controllers", ""),
      "pdfs",
      pathname
    );
    await page.pdf({
      path: pdfPath,
      format: "A4",
      printBackground: true,
      scale: 0.8,
      quality: 75,
    });
    await browser.close();

    setTimeout(() => {
      fs.unlink(pdfPath, (err) => {
        if (err) {
          console.error(`Failed to delete file: ${pdfPath}`, err);
        } else {
          console.log(`Successfully deleted file: ${pdfPath}`);
        }
      });
    }, 60000);

    const baseUrl = `https://${req.get("host")}`;
    const pdfUrl = `${baseUrl}/pdfs/${pathname}`;
    res.json({ url: pdfUrl, name: invoiceBatch.name });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error!" });
  }
};

function getDateAfterDays(dateStr, daysToAdd) {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + daysToAdd);
  return date.toISOString().split("T")[0];
}
const payInvoicePayment = async (req, res) => {
  const { _id: vendorId } = req.user;

  try {
    const { orderId, invoiceId, chargingStartDate } = req.body;
    console.log(orderId, invoiceId, chargingStartDate);

    if (!orderId || !vendorId || !chargingStartDate) {
      return res.status(400).json({
        success: false,
        message: "orderId, vendorId, and chargingStartDate are required.",
      });
    }
    await invoiceBatches.findOneAndUpdate(
      {
        "invoices._id": invoiceId,
      },
      {
        $set: {
          "invoices.$.paymentStatus": "Paid",
        },
      },
      { new: true }
    );

    await Order.findOneAndUpdate(
      { _id: orderId, vendorId },
      { chargingStartDate: getDateAfterDays(chargingStartDate, 2) },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Invoice Payment Paid Successfully!",
      // data: updatedOrder,
    });
  } catch (error) {
    console.error("Error updating chargingStartDate:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

module.exports = {
  generateInvoiceBatchNumber,
  confrimInvoiceBatchStatus,
  getAllInvoiveBatches,
  deleteInvoiceBatchById,
  getInvocieBatchById,
  removeOrderFromInvoiceBatch,
  getInvoiceById,
  invoicePrint,
  postSingleInvoice,
  postMulipleInvoice,
  confrimInvoice,
  multipleInvoicePrint,
  payInvoicePayment,
};
