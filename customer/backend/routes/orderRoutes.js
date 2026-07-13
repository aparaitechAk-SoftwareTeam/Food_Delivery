const express = require("express");
const {
  createOrder,
  getOrders,
  getOrderDetails,
  cancelOrder,
  reorder,
  getOrderTracking,
} = require("../controllers/orderController");
const protect = require("../middleware/authMiddleware");
const router = express.Router();

router.use(protect);
router.get("/", getOrders);
router.post("/", createOrder);
router.get("/:id", getOrderDetails);
router.get("/:id/tracking", getOrderTracking);
router.put("/:id/cancel", cancelOrder);
router.post("/:id/reorder", reorder);

module.exports = router;
