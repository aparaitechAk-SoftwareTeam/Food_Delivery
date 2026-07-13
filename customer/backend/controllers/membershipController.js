const MembershipPlan = require("../models/MembershipPlan");
const User = require("../models/User");
const WalletTransaction = require("../models/WalletTransaction");
const mongoose = require("mongoose");

exports.getPlans = async (req, res) => {
  try {
    const plans = await MembershipPlan.find().sort({ price: 1 });
    res.json(plans);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch membership plans: " + error.message });
  }
};

exports.purchaseMembership = async (req, res) => {
  const { planId } = req.body;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const plan = await MembershipPlan.findById(planId).session(session);
    if (!plan) {
      throw new Error("Membership plan not found");
    }

    const user = await User.findById(req.user._id).session(session);
    if (!user) {
      throw new Error("User not found");
    }

    if ((user.walletBalance || 0) < plan.price) {
      throw new Error("Insufficient wallet balance. Please add funds.");
    }

    // Deduct from wallet
    user.walletBalance -= plan.price;

    // Calculate new expiry date
    const now = new Date();
    let currentExpiry = user.goldExpiry && user.goldExpiry > now ? new Date(user.goldExpiry) : now;
    currentExpiry.setDate(currentExpiry.getDate() + plan.durationDays);

    user.isGoldMember = true;
    user.goldExpiry = currentExpiry;
    await user.save({ session });

    // Log wallet transaction
    await WalletTransaction.create(
      [
        {
          userId: user._id,
          type: "Payment",
          amount: plan.price,
          description: `Purchased Gold Membership Plan: ${plan.name}`,
        },
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    console.log(`[Membership] User ${user._id} purchased plan ${plan.name}. New Expiry: ${user.goldExpiry}`);
    res.json({
      message: "Gold Membership purchased successfully!",
      isGoldMember: user.isGoldMember,
      goldExpiry: user.goldExpiry,
      walletBalance: user.walletBalance,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ message: error.message });
  }
};
