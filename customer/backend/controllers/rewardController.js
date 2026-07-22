const cashbackService = require("../services/cashbackService");

exports.getRewardStatus = async (req, res) => {
  try {
    const data = await cashbackService.getRewardStatus(req.user._id);
    if (!data) {
      return res.json({
        reward: null,
        progress: 0,
        remainingTime: 0,
        status: "Pending"
      });
    }
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: "Failed to get reward status: " + error.message });
  }
};

exports.claimReward = async (req, res) => {
  try {
    const result = await cashbackService.claimCashback(req.user._id);
    res.json({
      message: "Reward claimed successfully",
      ...result,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
