const express = require("express");
const { getRewardStatus, claimReward } = require("../controllers/rewardController");
const protect = require("../middleware/authMiddleware");
const router = express.Router();

router.use(protect);
router.get("/", getRewardStatus);
router.post("/claim", claimReward);

module.exports = router;
