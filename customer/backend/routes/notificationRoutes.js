const express = require("express");
const { getNotifications, createNotification } = require("../controllers/notificationController");
const { optionalProtect } = require("../middleware/authMiddleware");
const router = express.Router();

router.get("/", optionalProtect, getNotifications);
router.post("/", createNotification);

module.exports = router;
