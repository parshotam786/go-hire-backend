const mongoose = require("mongoose");


const itemsSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    quantity: { type: Number, default: 1 },
    rate: { type: String },
    price: { type: Number },
    status: { type: String },
  },
  { timestamps: true }
);

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
      ref: "Vender",
    },
    account: { type: String, default: "" },
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
    siteContact: { type: String, default: "" },
    depot: { type: String, default: "" },
    salesPerson: { type: String, default: "" },
    orderedBy: { type: String, default: "" },
    invoiceRunCode: { type: String, default: "" },
    paymentTerm: { type: String, default: "" },
    billingPeriod: { type: String, default: "" },
    products: { type: [itemsSchema], default: [] },
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
