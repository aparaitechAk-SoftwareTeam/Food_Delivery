const express = require("express");
const Review = require("../models/Review");
const router = express.Router();

router.get("/food/:foodId", async (req, res) => {
  const reviews = await Review.find({ food: req.params.foodId }).populate(
    "user",
    "name",
  );
  res.json(reviews);
});

module.exports = router;
