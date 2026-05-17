const mongoose = require("mongoose");

const SignalSchema = new mongoose.Schema({
  signal: String,
  confidence: Number,
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Signal", SignalSchema);
