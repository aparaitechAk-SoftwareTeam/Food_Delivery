const WalletTransaction = require("../models/WalletTransaction");
const User = require("../models/User");

exports.getWalletDetails = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("walletBalance");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const transactions = await WalletTransaction.find({ userId: req.user._id }).sort({ createdAt: -1 });

    res.json({
      balance: user.walletBalance || 0,
      transactions,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to get wallet details: " + error.message });
  }
};
