const mongoose = require("mongoose");

const counterSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  value: { type: Number, default: 0 },
});

const Counter = mongoose.model("Counter", counterSchema);

const getNextSequenceValue = async (sequenceName) => {
  const sequenceDocument = await Counter.findOneAndUpdate(
    { name: sequenceName },
    { $inc: { value: 1 } },
    { new: true, upsert: true } // Create the document if it doesn't exist
  );

  return sequenceDocument.value;
};

const InvoiceSchema = new mongoose.Schema(
  {
    invoiceDate: { type: String },
    invoiceNumber: { type: String },
    deliveryNumber: { type: String },
    invoiceRefrence: { type: String },
    bookDate: {
      type: Date,
      default: Date.now,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },
    // customerId: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "Customers",
    // },
  },
  { timestamps: true }
);

InvoiceSchema.pre("save", async function (next) {
  if (!this.isNew) return next(); // Only for new documents

  try {
    const deliveryNumber = await getNextSequenceValue("deliveryNumber");
    this.deliveryNumber = `DN${String(deliveryNumber).padStart(2, "0")}`;

    const invoiceNumber = await getNextSequenceValue("invoiceNumber");
    this.invoiceNumber = `INV-${String(invoiceNumber).padStart(5, "0")}`;

    next();
  } catch (error) {
    next(error);
  }
});

const Invoice = mongoose.model("Invoice", InvoiceSchema);

module.exports = Invoice;
