const CounterId = require("../models/counterModel");

async function getNextSequence(sequenceName) {
  const counter = await CounterId.findByIdAndUpdate(
    { _id: sequenceName },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return counter.seq;
}

module.exports = { getNextSequence };
