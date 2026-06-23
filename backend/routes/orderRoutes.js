const express = require("express");
const { createOrder, getOrders } = require("../controllers/orderController");
const protect = require("../middleware/authMiddleware");
const router = express.Router();

router.use(protect);
router.get("/", getOrders);
router.post("/", createOrder);

module.exports = router;
