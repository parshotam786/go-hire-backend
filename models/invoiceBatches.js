const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema({
  productName: String,
  quantity: String,
  type: String,
  weeks: String,
  days: String,
  vat: String,
  price: String,
  minimumRentalPeriod: String,
  vatTotal: String,
  total: String,
});

const OrderSchema = new mongoose.Schema({
  id: mongoose.Schema.Types.ObjectId,
  invoiceDate: String,
  invoiceUptoDate: String,
  customerId: String,
  customer_id: String,
  deliveryAddress: String,
  customerName: String,
  customerAddress: String,
  customerAddress2: String,
  paymentTerms: String,
  customerCity: String,
  customerCountry: String,
  customerEmail: String,
  DocNumber: {
    type: String,
    default: null,
  },
  orderId: String,
  orderNumber: String,
  deliveryDate: String,
  orderDate: String,
  deliveryPlaceName: String,
  billingPlaceName: String,
  product: [ProductSchema],
  goods: String,
  total: String,
  tax: String,
  invocie: String,
  status: String,
});
const InvoiceBatches = new mongoose.Schema(
  {
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      required: true,
      ref: "Vender",
    },
    name: { type: String, required: true },
    description: { type: String },
    batchDate: { type: Date, required: true },
    invoiceStartDate: { type: Date, required: true },
    invoiceUptoDate: { type: Date, required: true },
    batchNumber: {
      type: String,
    },
    orders: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
        required: true,
      },
    ],
    totalInvoice: {
      type: Number,
    },
    totalPrice: {
      type: Number,
    },
    excludingTax: {
      type: Number,
    },
    tax: {
      type: Number,
    },
    invoices: [OrderSchema],
    status: {
      type: String,
      default: "Draft",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("InvoiceBatches", InvoiceBatches);
