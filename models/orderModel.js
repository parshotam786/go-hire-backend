const mongoose = require("mongoose");
const itemsSchema = require("./itemsSchema");

const orderSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true },
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      required: true,
      ref: "Vender",
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      required: true,
      ref: "Customers",
    },
    account: { type: String, default: "" },
    cunstomerQuickbookId: { type: String, default: "" },
    billingPlaceName: { type: String, default: "" },
    address1: { type: String, default: "" },
    address2: { type: String, default: "" },
    city: { type: String, default: "" },
    country: { type: String, default: "" },
    orderDate: { type: Date, default: null },
    deliveryPlaceName: { type: String, default: "" },
    deliveryAddress1: { type: String, default: "" },
    deliveryAddress2: { type: String, default: "" },
    deliveryCity: { type: String, default: "" },
    deliveryCountry: { type: String, default: "" },
    deliveryPostcode: { type: String, default: "" },
    deliveryDate: { type: Date, default: null },
    chargingStartDate: { type: Date, default: null },
    useExpectedReturnDate: { type: Boolean, default: false },
    customerReference: { type: String, default: "" },
    invoiceInBatch: {
      type: Number,
      Default: 0,
    },
    siteContact: { type: String, default: "" },
    depot: { type: String, default: "" },
    salesPerson: { type: String, default: "" },
    orderedBy: { type: String, default: "" },
    invoiceRunCode: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "InvoiceRunCode",
    },
    paymentTerm: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "PaymentTerm",
    },
    billingPeriod: { type: String, default: "" },
    products: { type: [itemsSchema], default: [] },
    status: {
      type: String,
      default: "Open",
    },
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
