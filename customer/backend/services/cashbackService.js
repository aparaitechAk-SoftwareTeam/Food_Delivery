const mongoose = require("mongoose");
const CashbackReward = require("../models/CashbackReward");
const WalletTransaction = require("../models/WalletTransaction");
const User = require("../models/User");
const Order = require("../models/Order");
const Food = require("../models/Food");
const Category = require("../models/Category");
const CashbackCampaign = require("../models/CashbackCampaign");
const Notification = require("../models/Notification");

/**
 * Automatically create a cashback reward for a newly registered user.
 */
exports.createRewardForNewUser = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user || user.role !== "customer") return null;

    // Expiry date is registration date + 48 hours
    const expiryDate = new Date(Date.now() + 48 * 60 * 60 * 1000);

    const reward = await CashbackReward.create({
      userId,
      totalRequiredOrders: 4,
      completedOrders: 0,
      cashbackAmount: 150,
      expiryDate,
      status: "Pending",
      countedOrders: [],
    });

    console.log(`[CashbackService] Created reward for new user ${userId}`);
    return reward;
  } catch (error) {
    console.error(`[CashbackService] Error creating reward: ${error.message}`);
    return null;
  }
};

/**
 * Handle progression when an order is updated to 'Delivered'.
 * Includes: New User Cashback, Referral rewards, and Cashback Campaign deals.
 */
exports.handleOrderDelivered = async (order) => {
  if (!order || order.status !== "Delivered") return;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = order.user?._id || order.user;
    if (!userId) {
      await session.abortTransaction();
      session.endSession();
      return;
    }

    const orderId = order._id;

    // ─── 1. NEW USER CASHBACK PROGRESS ───
    const reward = await CashbackReward.findOne({ userId }).session(session);
    if (reward) {
      const now = new Date();
      // Check if not expired or claimed
      if (now < reward.expiryDate && reward.status !== "Claimed" && reward.status !== "Expired") {
        if (!reward.countedOrders.includes(orderId)) {
          reward.countedOrders.push(orderId);
          reward.completedOrders = Math.min(reward.completedOrders + 1, reward.totalRequiredOrders);

          let notificationText = "";
          let notificationTitle = "";

          if (reward.completedOrders >= reward.totalRequiredOrders) {
            reward.status = "Eligible";
            notificationTitle = "Cashback Unlock!";
            notificationText = "Congratulations! Claim your ₹150 Cashback.";
          } else {
            notificationTitle = "Cashback Progress";
            notificationText = `Great! ${reward.completedOrders} of ${reward.totalRequiredOrders} orders completed.`;
          }

          reward.updatedAt = new Date();
          await reward.save({ session });

          await Notification.create(
            [
              {
                title: notificationTitle,
                description: notificationText,
                type: "Order Update",
                audience: "Specific User",
                userId,
              },
            ],
            { session }
          );
          console.log(`[CashbackService] Updated reward progress for user ${userId}`);
        }
      } else if (now >= reward.expiryDate && (reward.status === "Pending" || reward.status === "Eligible")) {
        reward.status = "Expired";
        await reward.save({ session });
        console.log(`[CashbackService] Reward expired for user ${userId}`);
      }
    }

    // ─── 2. REFERRAL SYSTEM REWARD ───
    const dbUser = await User.findById(userId).session(session);
    if (dbUser && dbUser.referredBy && !dbUser.referralRewarded) {
      // Check if this is their first delivered order
      const deliveredCount = await Order.countDocuments({
        user: userId,
        status: "Delivered",
      }).session(session);

      // deliveredCount is 1 because this current order is now set to Delivered
      if (deliveredCount === 1) {
        const referrerId = dbUser.referredBy;
        const referrer = await User.findById(referrerId).session(session);
        if (referrer) {
          // Credit ₹100 to referrer
          referrer.walletBalance = (referrer.walletBalance || 0) + 100;
          await referrer.save({ session });

          // Log WalletTransaction for referrer
          await WalletTransaction.create(
            [
              {
                userId: referrerId,
                type: "Cashback",
                amount: 100,
                description: `Referral Reward: ${dbUser.name} placed their first order`,
              },
            ],
            { session }
          );

          // Log notification for referrer
          await Notification.create(
            [
              {
                title: "Referral Reward Credited!",
                description: `₹100 credited to your wallet for inviting ${dbUser.name}.`,
                type: "Offers",
                audience: "Specific User",
                userId: referrerId,
              },
            ],
            { session }
          );

          // Mark friend as rewarded
          dbUser.referralRewarded = true;
          await dbUser.save({ session });
          console.log(`[CashbackService] Referral rewarded. Credited ₹100 to referrer ${referrerId}`);
        }
      }
    }

    // ─── 3. CASHBACK CAMPAIGNS ───
    const activeCampaigns = await CashbackCampaign.find({
      isActive: true,
      expiryDate: { $gt: new Date() },
    }).session(session);

    if (activeCampaigns.length > 0 && order.items && order.items.length > 0) {
      // Fetch and populate categories of all items in the order
      const foodIds = order.items.map((item) => item.food);
      const foods = await Food.find({ _id: { $in: foodIds } })
        .populate("category")
        .session(session);

      const foodMap = {};
      foods.forEach((f) => {
        foodMap[f._id.toString()] = f;
      });

      for (const campaign of activeCampaigns) {
        let qualifyingTotal = 0;

        for (const item of order.items) {
          const foodItem = foodMap[item.food.toString()];
          if (foodItem) {
            const foodCategoryName = foodItem.category?.name || "";
            if (
              campaign.category === "All" ||
              campaign.category.toLowerCase() === foodCategoryName.toLowerCase()
            ) {
              qualifyingTotal += item.price * item.quantity;
            }
          }
        }

        if (qualifyingTotal > 0) {
          let cashbackEarned = parseFloat(((qualifyingTotal * campaign.cashbackPercentage) / 100).toFixed(2));
          cashbackEarned = Math.min(cashbackEarned, campaign.cashbackCap);

          if (cashbackEarned > 0) {
            // Credit to user's wallet
            const customer = await User.findById(userId).session(session);
            if (customer) {
              customer.walletBalance = (customer.walletBalance || 0) + cashbackEarned;
              await customer.save({ session });

              // Log WalletTransaction
              await WalletTransaction.create(
                [
                  {
                    userId,
                    type: "Cashback",
                    amount: cashbackEarned,
                    description: `Cashback Deal: ${campaign.title}`,
                  },
                ],
                { session }
              );

              // Send notification
              await Notification.create(
                [
                  {
                    title: "Cashback Deals Reward",
                    description: `₹${cashbackEarned} Cashback credited to your wallet from campaign "${campaign.title}"!`,
                    type: "Offers",
                    audience: "Specific User",
                    userId,
                  },
                ],
                { session }
              );
              console.log(`[CashbackService] Credited ₹${cashbackEarned} cashback to user ${userId} from campaign "${campaign.title}"`);
            }
          }
        }
      }
    }

    await session.commitTransaction();
    session.endSession();
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error(`[CashbackService] Error handling order delivered hooks: ${error.message}`);
  }
};

/**
 * Claim the cashback reward.
 */
exports.claimCashback = async (userId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const reward = await CashbackReward.findOne({ userId }).session(session);
    if (!reward) {
      throw new Error("Cashback reward not found");
    }

    // Force update status to Expired if time has elapsed
    if (new Date() >= reward.expiryDate && (reward.status === "Pending" || reward.status === "Eligible")) {
      reward.status = "Expired";
      await reward.save({ session });
    }

    if (reward.status !== "Eligible") {
      throw new Error(`Reward cannot be claimed. Current status is: ${reward.status}`);
    }

    if (new Date() >= reward.expiryDate) {
      throw new Error("Offer has expired and cannot be claimed");
    }

    // Mark as Claimed
    reward.status = "Claimed";
    reward.claimedAt = new Date();
    reward.updatedAt = new Date();
    await reward.save({ session });

    // Credit user's wallet
    const user = await User.findById(userId).session(session);
    if (!user) {
      throw new Error("User not found");
    }
    user.walletBalance = (user.walletBalance || 0) + reward.cashbackAmount;
    await user.save({ session });

    // Record wallet transaction log
    await WalletTransaction.create(
      [
        {
          userId,
          type: "Cashback",
          amount: reward.cashbackAmount,
          description: "New User Cashback Reward",
        },
      ],
      { session }
    );

    // Send user notification
    await Notification.create(
      [
        {
          title: "Cashback Claimed",
          description: `₹${reward.cashbackAmount} Cashback added to your wallet.`,
          type: "Offers",
          audience: "Specific User",
          userId,
        },
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();
    console.log(`[CashbackService] User ${userId} successfully claimed ₹${reward.cashbackAmount} cashback`);
    return {
      status: "Claimed",
      walletBalance: user.walletBalance,
    };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error(`[CashbackService] Error claiming reward: ${error.message}`);
    throw error;
  }
};

/**
 * Retrieve the current reward status for a user.
 */
exports.getRewardStatus = async (userId) => {
  let reward = await CashbackReward.findOne({ userId });
  if (!reward) return null;

  // Check if expired and update state if necessary
  if (new Date() >= reward.expiryDate && (reward.status === "Pending" || reward.status === "Eligible")) {
    reward.status = "Expired";
    await reward.save();
  }

  const remainingTime = Math.max(0, Math.floor((new Date(reward.expiryDate) - new Date()) / 1000));
  const progress = (reward.completedOrders / reward.totalRequiredOrders) * 100;

  return {
    reward,
    progress,
    remainingTime,
    status: reward.status,
  };
};
