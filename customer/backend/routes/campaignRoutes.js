const express = require("express");
const { getActiveCampaigns } = require("../controllers/campaignController");
const router = express.Router();

router.get("/active", getActiveCampaigns);

module.exports = router;
