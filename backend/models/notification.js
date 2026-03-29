// models/Notification.model.js
const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            enum: ["SUSPICIOUS_ACTIVITY"],
            required: true,
        },
        voterId: { type: String, required: true },
        voterName: { type: String, default: "Unknown" },
        message: { type: String, required: true },
        read: { type: Boolean, default: false },
    },
    { timestamps: true }
);

const Notification = mongoose.model("Notification", notificationSchema);
module.exports = Notification;