const express = require("express");
const { getReferralHistory } = require("../controllers/referralController");
const protect = require("../middleware/authMiddleware");
const router = express.Router();

router.use(protect);
router.get("/history", getReferralHistory);

module.exports = router;
