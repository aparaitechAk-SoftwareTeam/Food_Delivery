const express = require("express");
const { getFoods, getFoodById } = require("../controllers/foodController");
const router = express.Router();

router.get("/", getFoods);
router.get("/:id", getFoodById);

module.exports = router;
