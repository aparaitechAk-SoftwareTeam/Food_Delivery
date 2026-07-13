require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");
const Order = require("./models/Order");
const CashbackReward = require("./models/CashbackReward");
const WalletTransaction = require("./models/WalletTransaction");
const Notification = require("./models/Notification");
const Restaurant = require("./models/Restaurant");
const cashbackService = require("./services/cashbackService");

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://Cloud_Kitchen:Aparaitech2129@aparaitechtest.8q6waob.mongodb.net/?appName=aparaitechtest";

async function runTests() {
  console.log("Connecting to MongoDB for testing...");
  await mongoose.connect(MONGO_URI);
  console.log("Connected successfully!");

  let testUser = null;
  const createdOrders = [];

  try {
    // 1. Create a dummy customer user
    const email = `test_cashback_${Date.now()}@foodexpress.com`;
    console.log(`\n--- Step 1: Creating test user: ${email} ---`);
    testUser = await User.create({
      name: "Test Cashback User",
      email,
      phone: `999000${Math.floor(1000 + Math.random() * 9000)}`,
      password: "password123",
      role: "customer",
      walletBalance: 0,
    });
    console.log(`Test user created: ${testUser._id}`);

    // 2. Verify auto-creation of CashbackReward
    console.log("\n--- Step 2: Triggering CashbackReward Creation ---");
    const reward = await cashbackService.createRewardForNewUser(testUser._id);
    if (!reward) throw new Error("Failed to create cashback reward");
    console.log(`Cashback reward created: status=${reward.status}, completedOrders=${reward.completedOrders}, expiryDate=${reward.expiryDate}`);

    if (reward.status !== "Pending") throw new Error(`Initial status should be Pending, got ${reward.status}`);
    if (reward.completedOrders !== 0) throw new Error(`Initial completedOrders should be 0, got ${reward.completedOrders}`);

    // 3. Find a restaurant or create dummy
    const restObj = await Restaurant.findOne({});
    const restaurantId = restObj ? restObj._id : new mongoose.Types.ObjectId();

    // 4. Simulate delivered orders and check progression
    console.log("\n--- Step 3: Placing 4 delivered orders to verify progression ---");
    for (let i = 1; i <= 4; i++) {
      const order = await Order.create({
        orderNumber: `ORD-TEST-${Date.now()}-${i}`,
        user: testUser._id,
        restaurant: restaurantId,
        items: [],
        totalAmount: 100 * i,
        status: "Pending",
        paymentMethod: "Cash on Delivery",
        paymentStatus: "Pending",
      });
      createdOrders.push(order);

      // Transition status to Delivered
      order.status = "Delivered";
      await order.save();

      // Trigger service progression hook
      await cashbackService.handleOrderDelivered(order);

      // Verify progress status
      const statusData = await cashbackService.getRewardStatus(testUser._id);
      console.log(`Order ${i}/4 delivered -> completedOrders=${statusData.reward.completedOrders}, status=${statusData.status}`);

      if (i < 4 && statusData.status !== "Pending") {
        throw new Error(`Status should be Pending at order ${i}, got ${statusData.status}`);
      }
      if (i === 4 && statusData.status !== "Eligible") {
        throw new Error(`Status should be Eligible at order 4, got ${statusData.status}`);
      }
    }

    // 4. Verify duplicate order prevention (re-deliver order 4)
    console.log("\n--- Step 4: Testing duplicate order prevention ---");
    const lastOrder = createdOrders[createdOrders.length - 1];
    await cashbackService.handleOrderDelivered(lastOrder);
    const statusDataAfterDuplicate = await cashbackService.getRewardStatus(testUser._id);
    console.log(`Re-delivered order 4 -> completedOrders=${statusDataAfterDuplicate.reward.completedOrders} (Expected: 4)`);
    if (statusDataAfterDuplicate.reward.completedOrders !== 4) {
      throw new Error(`Completed orders should remain 4, got ${statusDataAfterDuplicate.reward.completedOrders}`);
    }

    // 5. Claim Cashback
    console.log("\n--- Step 5: Claiming reward ---");
    const claimResult = await cashbackService.claimCashback(testUser._id);
    console.log(`Claim successful: status=${claimResult.status}, walletBalance=${claimResult.walletBalance}`);

    if (claimResult.status !== "Claimed") throw new Error(`Status should be Claimed, got ${claimResult.status}`);
    if (claimResult.walletBalance !== 150) throw new Error(`Wallet balance should be 150, got ${claimResult.walletBalance}`);

    // Verify wallet transaction log
    const txn = await WalletTransaction.findOne({ userId: testUser._id });
    if (!txn) throw new Error("WalletTransaction was not logged");
    console.log(`WalletTransaction found: type=${txn.type}, amount=${txn.amount}, desc=${txn.description}`);

    // Verify user notification exists
    const notification = await Notification.findOne({ userId: testUser._id, title: "Cashback Claimed" });
    if (!notification) throw new Error("Claimed notification was not generated");
    console.log(`Notification found: title=${notification.title}, desc=${notification.description}`);

    console.log("\n=============================");
    console.log(" ALL INTEGRATION TESTS PASSED SUCCESSFULLY! ");
    console.log("=============================");
  } catch (error) {
    console.error(`\nTest failed: ${error.message}`);
    process.exitCode = 1;
  } finally {
    // Cleanup
    console.log("\nCleaning up database records...");
    if (testUser) {
      await User.deleteOne({ _id: testUser._id });
      await CashbackReward.deleteOne({ userId: testUser._id });
      await WalletTransaction.deleteMany({ userId: testUser._id });
      await Notification.deleteMany({ userId: testUser._id });
    }
    for (const order of createdOrders) {
      await Order.deleteOne({ _id: order._id });
    }
    await mongoose.connection.close();
    console.log("Database connection closed. Cleanup complete.");
  }
}

runTests();
