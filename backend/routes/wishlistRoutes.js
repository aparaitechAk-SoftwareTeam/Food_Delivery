const express = require("express");
const {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
} = require("../controllers/wishlistController");
const protect = require("../middleware/authMiddleware");
const router = express.Router();

router.use(protect);
router.get("/", getWishlist);
router.post("/add", addToWishlist);
router.delete("/remove/:foodId", removeFromWishlist);

// Fallbacks
router.post("/", addToWishlist);
router.delete("/:foodId", removeFromWishlist);

module.exports = router;
