const express = require("express");
const { getBanners, createBanner } = require("../controllers/bannerController");
const router = express.Router();

router.get("/", getBanners);
router.post("/", createBanner);

module.exports = router;
