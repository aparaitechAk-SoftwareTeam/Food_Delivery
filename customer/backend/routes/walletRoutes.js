const express = require("express");
const { getWalletDetails } = require("../controllers/walletController");
const protect = require("../middleware/authMiddleware");
const router = express.Router();

router.use(protect);
router.get("/", getWalletDetails);

module.exports = router;
