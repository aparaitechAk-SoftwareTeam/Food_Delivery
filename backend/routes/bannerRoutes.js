const express = require("express");
const { getBanners, createBanner } = require("../controllers/bannerController");
const router = express.Router();

router.route("/")
  .get(getBanners)
  .post(createBanner);

module.exports = router;
