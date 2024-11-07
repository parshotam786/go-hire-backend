// const mongoose = require("mongoose");

// const counterSchema = new mongoose.Schema({
//   name: { type: String, required: true, unique: true },
//   value: { type: Number, default: 0 },
// });

// const Counter = mongoose.model("Counter", counterSchema);

// const getNextSequenceValue = async (sequenceName) => {
//   const sequenceDocument = await Counter.findOneAndUpdate(
//     { name: sequenceName },
//     { $inc: { value: 1 } },
//     { new: true, upsert: true } // Create the document if it doesn't exist
//   );

//   return sequenceDocument.value;
// };

// const InvoiceSchema = new mongoose.Schema(
//   {
//     invoiceDate: { type: String },
//     invoiceNumber: { type: String },
//     deliveryNumber: { type: String },
//     invoiceRefrence: { type: String },
//     bookDate: {
//       type: Date,
//       default: Date.now,
//     },
//     orderId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Order",
//     },
//     customerId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Customers",
//     },
//     vendorId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Vender",
//     },
//   },
//   { timestamps: true }
// );

// const Invoice = mongoose.model("Invoice", InvoiceSchema);

// module.exports = Invoice;
