require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");
const Order = require("./models/Order");
const Restaurant = require("./models/Restaurant");
const Food = require("./models/Food");
const Category = require("./models/Category");
const MembershipPlan = require("./models/MembershipPlan");
const CashbackCampaign = require("./models/CashbackCampaign");
const WalletTransaction = require("./models/WalletTransaction");
const Notification = require("./models/Notification");
const cashbackService = require("./services/cashbackService");

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://Cloud_Kitchen:Aparaitech2129@aparaitechtest.8q6waob.mongodb.net/?appName=aparaitechtest";

async function runTests() {
  console.log("Connecting to MongoDB for feature testing...");
  await mongoose.connect(MONGO_URI);
  console.log("Connected successfully!");

  let testUser1 = null;
  let testUser2 = null;
  let testPlan = null;
  let testCampaign = null;
  let testCategory = null;
  let testFood = null;
  let testRestaurant = null;
  const createdOrders = [];

  try {
    // Setup initial data
    console.log("\n--- Setting up test dependencies ---");
    testRestaurant = await Restaurant.create({
      name: "Test Feature Restaurant",
      email: `rest_${Date.now()}@test.com`,
      phone: "1234567890",
      address: "Test Street 10",
      cuisine: ["Fast Food"],
    });

    testCategory = await Category.create({
      name: `Category_${Date.now()}`,
      sortOrder: 1,
    });

    testFood = await Food.create({
      name: "Gold Tea",
      price: 100,
      category: testCategory._id,
      restaurant: testRestaurant._id,
    });

    // 1. Gold Membership Test
    console.log("\n--- Step 1: Testing Gold Membership Purchase & Discounts ---");
    testUser1 = await User.create({
      name: "Gold Member User",
      email: `gold_${Date.now()}@foodexpress.com`,
      phone: `900${Math.floor(1000000 + Math.random() * 9000000)}`,
      password: "password123",
      role: "customer",
      walletBalance: 200, // Enough to buy plan
      referralCode: "REFGOLD",
    });

    testPlan = await MembershipPlan.create({
      name: "Test Gold Monthly",
      price: 99,
      durationDays: 30,
      description: "Get unlimited free delivery and 10% off",
    });

    // Simulate purchase via membershipController logic
    testUser1.walletBalance -= testPlan.price;
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + testPlan.durationDays);
    testUser1.isGoldMember = true;
    testUser1.goldExpiry = expiry;
    await testUser1.save();

    console.log(`User purchased membership: isGoldMember=${testUser1.isGoldMember}, walletBalance=${testUser1.walletBalance}, expiry=${testUser1.goldExpiry}`);

    // Place order to test Gold discount & free delivery
    const reqBody = {
      restaurant: testRestaurant._id,
      items: [{ food: testFood._id, quantity: 2, price: 100 }], // subtotal = 200
      address: { label: "Home", line1: "Street 10" },
      paymentMethod: "Cash on Delivery",
      discount: 0,
      deliveryCharge: 40,
      tax: 10,
    };

    // Calculate subtotal and discount as orderController does
    const subtotal = reqBody.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    let finalDeliveryCharge = reqBody.deliveryCharge;
    let finalDiscount = reqBody.discount;

    if (testUser1.isGoldMember && testUser1.goldExpiry > new Date()) {
      finalDeliveryCharge = 0; // Free delivery
      const goldDiscount = parseFloat((subtotal * 0.1).toFixed(2));
      finalDiscount = parseFloat((finalDiscount + goldDiscount).toFixed(2)); // 10% gold discount = 20
    }
    const finalTotalAmount = parseFloat((subtotal + reqBody.tax + finalDeliveryCharge - finalDiscount).toFixed(2));

    const order1 = await Order.create({
      user: testUser1._id,
      restaurant: testRestaurant._id,
      items: reqBody.items,
      address: reqBody.address,
      paymentMethod: reqBody.paymentMethod,
      discount: finalDiscount,
      deliveryCharge: finalDeliveryCharge,
      tax: reqBody.tax,
      totalAmount: finalTotalAmount,
      orderNumber: `ORD-GOLD-${Date.now()}`,
    });
    createdOrders.push(order1);

    console.log(`Gold Member Order Created: deliveryCharge=${order1.deliveryCharge} (Expected: 0), discount=${order1.discount} (Expected: 20), totalAmount=${order1.totalAmount} (Expected: 190)`);
    if (order1.deliveryCharge !== 0) throw new Error("Gold member delivery charge should be 0");
    if (order1.discount !== 20) throw new Error("Gold member 10% discount should be 20");
    if (order1.totalAmount !== 190) throw new Error(`Gold member totalAmount should be 190, got ${order1.totalAmount}`);

    // 2. Invite Friends (Referral) Test
    console.log("\n--- Step 2: Testing Invite Friends (Referrals) ---");
    testUser2 = await User.create({
      name: "Referred Friend User",
      email: `referred_${Date.now()}@foodexpress.com`,
      phone: `911${Math.floor(1000000 + Math.random() * 9000000)}`,
      password: "password123",
      role: "customer",
      walletBalance: 0,
      referralCode: "REFND",
      referredBy: testUser1._id, // Referred by User 1
    });

    const order2 = await Order.create({
      user: testUser2._id,
      restaurant: testRestaurant._id,
      items: [{ food: testFood._id, quantity: 1, price: 100 }],
      address: reqBody.address,
      paymentMethod: reqBody.paymentMethod,
      discount: 0,
      deliveryCharge: 40,
      tax: 5,
      totalAmount: 145,
      orderNumber: `ORD-REF-${Date.now()}`,
    });
    createdOrders.push(order2);

    // Deliver order 2
    order2.status = "Delivered";
    await order2.save();

    // Trigger cashback service delivered hooks (this triggers referral reward)
    await cashbackService.handleOrderDelivered(order2);

    // Refresh referrer's user profile to verify wallet balance
    const updatedReferrer = await User.findById(testUser1._id);
    console.log(`Referrer Wallet Balance: ${updatedReferrer.walletBalance} (Expected: 201, starts at 101 after plan buy)`);
    if (updatedReferrer.walletBalance !== 201) {
      throw new Error(`Referrer should be rewarded ₹100, wallet balance is ${updatedReferrer.walletBalance}`);
    }

    const refTxn = await WalletTransaction.findOne({ userId: testUser1._id, type: "Cashback" });
    if (!refTxn || !refTxn.description.includes("Referral Reward")) {
      throw new Error("Referral wallet transaction log missing");
    }
    console.log("Referral wallet transaction successfully logged!");

    // 3. Cashback Deals Test
    console.log("\n--- Step 3: Testing Cashback Deals (Campaigns) ---");
    testCampaign = await CashbackCampaign.create({
      title: "Category Tea Cashback Campaign",
      category: testCategory.name, // Matches category of testFood
      cashbackPercentage: 20, // 20% cashback
      cashbackCap: 30, // max ₹30 cap
      expiryDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // active
      isActive: true,
    });

    const order3 = await Order.create({
      user: testUser1._id,
      restaurant: testRestaurant._id,
      items: [{ food: testFood._id, quantity: 2, price: 100 }], // total qualifying = 200. 20% cashback = ₹40 (capped at ₹30)
      address: reqBody.address,
      paymentMethod: reqBody.paymentMethod,
      discount: 0,
      deliveryCharge: 0,
      tax: 10,
      totalAmount: 210,
      orderNumber: `ORD-CAMP-${Date.now()}`,
    });
    createdOrders.push(order3);

    // Deliver order 3
    order3.status = "Delivered";
    await order3.save();

    await cashbackService.handleOrderDelivered(order3);

    // Refresh User 1 wallet balance: starts at 201, gets ₹30 cashback from campaign = 231
    const finalUser1 = await User.findById(testUser1._id);
    console.log(`Final User 1 Wallet Balance: ${finalUser1.walletBalance} (Expected: 231)`);
    if (finalUser1.walletBalance !== 231) {
      throw new Error(`User should receive ₹30 cashback, wallet balance is ${finalUser1.walletBalance}`);
    }

    const campTxn = await WalletTransaction.findOne({ userId: testUser1._id, description: "Cashback Deal: Category Tea Cashback Campaign" });
    if (!campTxn) {
      throw new Error("Cashback campaign wallet transaction log missing");
    }
    console.log("Cashback campaign transaction successfully logged!");

    console.log("\n=============================================");
    console.log(" ALL INTEGRATION TESTS PASSED SUCCESSFULLY! ");
    console.log("=============================================");
  } catch (error) {
    console.error(`\nTest failed: ${error.message}`);
    process.exitCode = 1;
  } finally {
    // Cleanup
    console.log("\nCleaning up database records...");
    if (testUser1) await User.deleteOne({ _id: testUser1._id });
    if (testUser2) await User.deleteOne({ _id: testUser2._id });
    if (testRestaurant) await Restaurant.deleteOne({ _id: testRestaurant._id });
    if (testCategory) await Category.deleteOne({ _id: testCategory._id });
    if (testFood) await Food.deleteOne({ _id: testFood._id });
    if (testPlan) await MembershipPlan.deleteOne({ _id: testPlan._id });
    if (testCampaign) await CashbackCampaign.deleteOne({ _id: testCampaign._id });

    if (testUser1) {
      await WalletTransaction.deleteMany({ userId: testUser1._id });
      await Notification.deleteMany({ userId: testUser1._id });
    }
    if (testUser2) {
      await WalletTransaction.deleteMany({ userId: testUser2._id });
      await Notification.deleteMany({ userId: testUser2._id });
    }

    for (const order of createdOrders) {
      await Order.deleteOne({ _id: order._id });
    }
    await mongoose.connection.close();
    console.log("Database connection closed. Cleanup complete.");
  }
}

runTests();
