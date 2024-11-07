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
  deliveryAddress: String,
  customerName: String,
  customerAddress: String,
  customerAddress2: String,
  customerCity: String,
  customerCountry: String,
  customerEmail: String,
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

const InvoiceBatchSchema = new mongoose.Schema(
  {
    name: String,
    description: String,
    batchDate: Date,
    batchId: String,
    invoiceStartDate: Date,
    invoiceUptoDate: Date,
    batchNumber: String,
    totalInvoice: String,
    totalPrice: String,
    excludingTax: String,
    tax: String,
    orders: [OrderSchema],
    status: String,
  },
  { timestamps: true }
);

const InvoiceBatch = mongoose.model("Invoice", InvoiceBatchSchema);

module.exports = InvoiceBatch;
