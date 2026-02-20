const mongoose = require('mongoose');

const voterSchema = new mongoose.Schema({
  aadhaar: { type: String, required: true, unique: true },
  name: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Voter', voterSchema);
