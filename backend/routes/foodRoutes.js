const express = require("express");
const {
  getFoods,
  getFoodById,
  getProductsByCategory,
  getProductsByCuisine,
  getBestsellers,
  getCategorizedMenu,
  getNewArrivals,
  getHealthy,
  getCombos,
  getTrending,
  getPopular,
  getRecommended,
} = require("../controllers/foodController");
const router = express.Router();

router.get("/", getFoods);
router.get("/bestsellers", getBestsellers);
router.get("/categorized", getCategorizedMenu);
router.get("/new-arrivals", getNewArrivals);
router.get("/healthy", getHealthy);
router.get("/combos", getCombos);
router.get("/trending", getTrending);
router.get("/popular", getPopular);
router.get("/recommended", getRecommended);
router.get("/category/:category", getProductsByCategory);
router.get("/cuisine/:cuisine", getProductsByCuisine);
router.get("/:id", getFoodById);

module.exports = router;
