const express = require("express");
const {
  getFavorites,
  toggleFavorite,
} = require("../controllers/favoriteController");
const protect = require("../middleware/authMiddleware");
const router = express.Router();

router.use(protect);

router.route("/")
  .get(getFavorites)
  .post(toggleFavorite);

module.exports = router;
