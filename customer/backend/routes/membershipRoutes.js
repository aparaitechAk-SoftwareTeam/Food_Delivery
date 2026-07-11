const express = require("express");
const { getPlans, purchaseMembership } = require("../controllers/membershipController");
const protect = require("../middleware/authMiddleware");
const router = express.Router();

router.get("/plans", getPlans);
router.post("/purchase", protect, purchaseMembership);

module.exports = router;
