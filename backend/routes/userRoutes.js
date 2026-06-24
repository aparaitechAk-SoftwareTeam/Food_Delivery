const express = require("express");
const {
  getProfile,
  updateProfile,
  getAddresses,
  addAddress,
  setDefaultAddress,
} = require("../controllers/userController");
const protect = require("../middleware/authMiddleware");
const router = express.Router();

router.use(protect);

router.route("/profile")
  .get(getProfile)
  .put(updateProfile);

router.route("/addresses")
  .get(getAddresses);

router.route("/address")
  .post(addAddress);

router.route("/addresses/:addressId/default")
  .put(setDefaultAddress);

module.exports = router;
