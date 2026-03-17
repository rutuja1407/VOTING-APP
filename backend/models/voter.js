import mongoose from "mongoose";

const voterSchema = new mongoose.Schema(
  {
    voterId: {
      type: String,
      required: true,
      unique: true,
      match: /^ABC\d{5}$/, // ensures format ABC12345
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

export default mongoose.model("Voter", voterSchema);