const Notification = require("../models/Notification");

// Get all notifications sorted by newest
exports.getNotifications = async (req, res) => {
  try {
    const list = await Notification.find().sort({ createdAt: -1 });
    res.json(list);
  } catch (error) {
    res.status(500).json({ message: "Failed to retrieve notifications: " + error.message });
  }
};

// Create a new notification (from admin panel broadcast)
exports.createNotification = async (req, res) => {
  try {
    const { title, message, type, audience } = req.body;
    if (!title || !message) {
      return res.status(400).json({ message: "Title and message are required" });
    }

    const item = await Notification.create({
      title,
      description: message,
      type: type || "System Notice",
      audience: audience || "All Users",
    });

    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ message: "Failed to save notification: " + error.message });
  }
};
