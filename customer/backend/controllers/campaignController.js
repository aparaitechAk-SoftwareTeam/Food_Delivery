const CashbackCampaign = require("../models/CashbackCampaign");

exports.getActiveCampaigns = async (req, res) => {
  try {
    const campaigns = await CashbackCampaign.find({
      isActive: true,
      expiryDate: { $gt: new Date() },
    }).sort({ cashbackPercentage: -1 });

    res.json(campaigns);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch active cashback campaigns: " + error.message });
  }
};
