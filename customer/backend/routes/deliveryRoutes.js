const express = require("express");
const {
  toggleOnlineStatus,
  updateLocation,
  getAssignedOrders,
  updateDeliveryStatus,
  getRiderEarnings,
  getRiderHistory,
  getRiderReviews
} = require("../controllers/deliveryController");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

// All delivery boy routes require token protection
router.use(protect);

router.put("/status", toggleOnlineStatus);
router.put("/location", updateLocation);
router.get("/orders", getAssignedOrders);
router.put("/orders/:id/status", updateDeliveryStatus);
router.get("/earnings", getRiderEarnings);
router.get("/history", getRiderHistory);
router.get("/reviews", getRiderReviews);

module.exports = router;
