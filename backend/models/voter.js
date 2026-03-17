const mongoose = require("mongoose");

const voterSchema = new mongoose.Schema(
  {
    voterId: {
      type: String,
      required: true,
      unique: true,
    },

    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      unique: true,
      match: /^[6-9]\d{9}$/, // Indian phone validation
    },

    // 🔥 Important for your biometric system
    faceDescriptor: {
      type: [Number], // array of 128 floats from face-api.js
      default: [],
    }
  },
);

const Voter = mongoose.model("Voter", voterSchema);
module.exports = Voter;