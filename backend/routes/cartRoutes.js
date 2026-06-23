const express = require("express");
const {
  getCart,
  updateCart,
  clearCart,
} = require("../controllers/cartController");
const protect = require("../middleware/authMiddleware");
const router = express.Router();

router.use(protect);
router.get("/", getCart);
router.put("/", updateCart);
router.delete("/", clearCart);

module.exports = router;
