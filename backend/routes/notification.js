// routes/notification.routes.js
const express = require("express");
const Notification = require("../models/notification");
const User = require("../models/user");

const router = express.Router();

// Called by forceLogout on the frontend
router.post("/admin", async (req, res) => {
  try {
    const { voterId, message, type } = req.body;

    // Grab the voter's name from DB to make the toast human-readable
    const voter = await User.findOne({ voterId });

    await Notification.create({
      type,
      voterId,
      voterName: voter?.name || "Unknown",
      message,
    });

    res.status(201).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to create notification" });
  }
});

// Called immediately after admin logs in
router.get("/admin/unread", async (req, res) => {
  try {
    const notifications = await Notification.find({ read: false }).sort({
      createdAt: -1,
    });
    res.status(200).json({ notifications });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

// Called after frontend has displayed the toasts
router.patch("/admin/mark-read", async (req, res) => {
  try {
    await Notification.updateMany({ read: false }, { read: true });
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to mark notifications as read" });
  }
});

module.exports = router;