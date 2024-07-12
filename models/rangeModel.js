const mongoose = require('mongoose')

const rangeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true // Ensure city names are unique
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Range', // Reference to another Range document
    default: null // Default parent to null
  }
});

module.exports = mongoose.model('Range', rangeSchema);