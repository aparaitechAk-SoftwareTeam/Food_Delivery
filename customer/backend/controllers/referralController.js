const User = require("../models/User");

exports.getReferralHistory = async (req, res) => {
  try {
    const referredUsers = await User.find({ referredBy: req.user._id })
      .select("name email createdAt referralRewarded")
      .sort({ createdAt: -1 });

    res.json(referredUsers);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch referral history: " + error.message });
  }
};
