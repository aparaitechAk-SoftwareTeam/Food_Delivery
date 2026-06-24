const express = require("express");
const {
  createOrder,
  getOrders,
  getOrderDetails,
  cancelOrder,
  reorder
} = require("../controllers/orderController");
const protect = require("../middleware/authMiddleware");
const router = express.Router();

router.use(protect);
router.get("/", getOrders);
router.post("/", createOrder);
router.get("/:id", getOrderDetails);
router.put("/:id/cancel", cancelOrder);
router.post("/:id/reorder", reorder);

module.exports = router;
