const moment = require("moment/moment");
const invoiceBatches = require("../models/invoiceBatches");
const Order = require("../models/orderModel");
const Document = require("../models/documentNumber");

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
      .populate("products.product");

    const filteredOrders = orders.filter((order) => order.invoiceRunCode);

    if (!filteredOrders.length) {
      return res.status(404).json({ message: "No matching orders found" });
    }
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
              // productName: item.productName,
              // quantity: item.quantity,
              // type: item.status,
              // weeks: fullWeeks,
              // days: remainingDays,
              // vat: item.taxRate,
              // price: item.price,
              // minimumRentalPeriod: minimumRentailPeriod,
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

    const invoiceData = await invoiceBatches
      .findById(req.params.id)
      .populate("orders");

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
        invoiceDate: invoiceData.batchDate,
        product: productData,
        goods,
        total,
        tax: total - goods,
        billingPlaceName: element.billingPlaceName,
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
        orders: filterData,
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
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  generateInvoiceBatchNumber,
  getAllInvoiveBatches,
  deleteInvoiceBatchById,
  getInvocieBatchById,
};
