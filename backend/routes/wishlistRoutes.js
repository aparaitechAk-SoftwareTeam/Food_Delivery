const express = require("express");
const {
  getWishlist,
  updateWishlist,
} = require("../controllers/wishlistController");
const protect = require("../middleware/authMiddleware");
const router = express.Router();

router.use(protect);
router.get("/", getWishlist);
router.put("/", updateWishlist);

module.exports = router;
