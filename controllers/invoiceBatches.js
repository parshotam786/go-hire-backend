const moment = require("moment/moment");
const invoiceBatches = require("../models/invoiceBatches");
const Order = require("../models/orderModel");
const Document = require("../models/documentNumber");
const nodemailer = require("nodemailer"); // Require nodemailer
const { chromium } = require("playwright");

const Customer = require("../models/customers");
const htmlPdf = require("html-pdf");
const puppeteer = require("puppeteer");
const fs = require("fs");
const Handlebars = require("handlebars");
const path = require("path");

const {
  countDaysBetween,
  countWeekdaysBetweenDates,
  calculateProductPrice,
  percetageCalculate,
} = require("../utiles/helper");

const generateAlphanumericId = async (vendorId, type = "Order") => {
  const document = await Document.findOne({ name: type, vendorId });
  const uniqueId =
    document.code + "-" + (document.seed + document.counter).toString();

  return uniqueId;
};

const generateInvoiceBatchNumber = async (req, res) => {
  const vendorId = req.user._id;
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
        $gte: new Date(invoiceStartDate),
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
      .populate(["customerId", "products.product"]);

    const filteredOrders = orders.filter((order) => order.invoiceRunCode);

    if (!filteredOrders.length) {
      return res.status(404).json({ message: "No matching orders found" });
    }

    console.log({ orders });
    const allInvoice = orders.map((element) => {
      const chargingStart = element.chargingStartDate;
      const bookDateStart = new Date(invoiceUptoDate);
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
        invoiceUptoDate: moment(invoiceUptoDate).format("l"),
        // invoiceNumber: deliveryData.deliveryNote || deliveryData.returnNote,
        deliveryAddress: element.deliveryAddress1,
        customerName: element.billingPlaceName,
        customerAddress: element.address1,
        customerAddress2: element.address2,
        customerCity: element.city,
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
      console.log({ daysCount, totalDaysCount });

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
    console.log({ invoiceData });
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
    console.log(
      invoiceBatch.totalPrice,
      invoiceBatch.tax,
      invoiceBatch.totalInvoice
    );
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
    console.log(
      filterData,

      "ddd"
    );
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

    // Find the InvoiceBatch by its ID
    const invoiceBatch = await invoiceBatches.findById(id).populate({
      path: "orders",
      populate: [{ path: "products.product" }, { path: "customerId" }],
    });

    if (!invoiceBatch) {
      return res.status(404).json({ message: "Invoice Batch not found" });
    }

    // // Find the specific invoice within the invoices array
    // const invoice = invoiceBatch.invoices.id(invoiceId);
    const filterInvoice = invoiceBatch.invoices.filter(
      (item) => item.id == invoiceId
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
  const browser = await chromium.launch(); // Use Playwright to launch Chromium
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

    // Find the InvoiceBatch by its ID
    const invoiceBatch = await invoiceBatches.findById(id).populate({
      path: "orders",
      populate: [{ path: "products.product" }, { path: "customerId" }],
    });

    if (!invoiceBatch) {
      return res.status(404).json({ message: "Invoice Batch not found" });
    }

    // update invoice status
    const result = await invoiceBatches.findOneAndUpdate(
      {
        _id: id,
        "invoices.id": invoiceId,
      },
      {
        $set: { "invoices.$.status": "Posted" },
      },
      { new: true }
    );

    if (!result) {
      return { success: false, message: "InvoiceBatch or Order not found" };
    }

    const filterInvoice = invoiceBatch.invoices.filter(
      (item) => item.id == invoiceId
    );
    if (!filterInvoice[0]) {
      return res
        .status(404)
        .json({ success: false, message: "Invoice not found in this batch" });
    }
    const invoiceDetail = filterInvoice[0];
    const invoiceData = {
      // brandLogo: vendor.brandLogo,
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

    const templatePath = path.join(__dirname, "invoicePrint.html");
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

    res.status(200).json({
      message: "Invoice Posted successfully!",
      success: true,
    });
  } catch (error) {
    console.error("Error fetching invoices by vendor ID:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

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

    // InvoiceBatch.invoices.forEach(async (invoice) => {
    //   await Document.findOneAndUpdate(
    //     { name: "Invoice", vendorId: vendorId },
    //     { $inc: { counter: 1 } },
    //     { new: true }
    //   );
    //   invoice.status = status;
    //   invoice.invocie = batchNumber;
    // });

    for await (let invoice of InvoiceBatch.invoices) {
      const batchNumber = await generateAlphanumericId(vendorId, "Invoice");

      await Document.findOneAndUpdate(
        { name: "Invoice", vendorId: vendorId },
        { $inc: { counter: 1 } },
        { new: true }
      );

      invoice.status = status;
      invoice.invocie = batchNumber;
    }
    // Save the updated InvoiceBatch
    // await InvoiceBatch.save();
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

const invoicePrint = async (req, res) => {
  const { _id: vendorId } = req.user;
  try {
    const { id, invoiceId } = req.body;

    // Find the InvoiceBatch by its ID
    const invoiceBatch = await invoiceBatches.findById(id).populate({
      path: "orders",
      populate: [{ path: "products.product" }, { path: "customerId" }],
    });

    if (!invoiceBatch) {
      return res.status(404).json({ message: "Invoice Batch not found" });
    }

    // // Find the specific invoice within the invoices array
    // const invoice = invoiceBatch.invoices.id(invoiceId);
    const filterInvoice = invoiceBatch.invoices.filter(
      (item) => item.id == invoiceId
    );
    if (!filterInvoice[0]) {
      return res
        .status(404)
        .json({ success: false, message: "Invoice not found in this batch" });
    }
    const invoiceDetail = filterInvoice[0];

    const invoiceData = {
      // brandLogo: vendor.brandLogo,
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

    // Load and compile HTML template
    const templatePath = path.join(__dirname, "invoicePrint.html");
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
      quality: 75,
    });
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
    }, 3000); // 1 minute
    const baseUrl = `${req.protocol}://${req.get("host")}`;

    // Send back the URL for the PDF
    const pdfUrl = `${baseUrl}/pdfs/${pathname}`;
    res.json({ url: pdfUrl });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error!" });
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
};
