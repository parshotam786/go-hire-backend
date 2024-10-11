const mongoose = require("mongoose");

const rateDefinitionSchema = new mongoose.Schema({
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
    required: true,
    ref: "Vender",
  },
  name: { type: String },
  description: { type: String },
  // companyName: { type: String },
  // rateEngine: { type: String },
  rateType: { type: String },
  isActive: { type: Boolean, default: false },
  dayRates: [
    {
      active: { type: Boolean, default: false },
      rate: { type: String },
    },
  ],
  rentalDaysPerWeek: { type: Number },
  minimumRentalPeriod: { type: Number },
  // weekRate: { type: String },
  // dayRate: { type: String },
  // monthlyRate: { type: String }, // Use correct case for MonthlyRate
  // subsequentWeeksRate: {
  //   active: { type: Boolean, default: false },
  //   rate: { type: String },
  // },
  // subsequentDaysRate: {
  //   active: { type: Boolean, default: false },
  //   rate: { type: String },
  // },
  // weekendRate: {
  //   active: { type: Boolean, default: false },
  //   rate: { type: String },
  // },
  // useWholeWeekCharging: { type: Boolean, default: false },
  // calendarDay: { type: String },
  // leewayMinutes: { type: Number },
});

const RateDefinition = mongoose.model("RateDefinition", rateDefinitionSchema);

module.exports = RateDefinition;
