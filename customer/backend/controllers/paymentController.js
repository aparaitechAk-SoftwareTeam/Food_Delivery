const crypto = require("crypto");
const Razorpay = require("razorpay");
const Order = require("../models/Order");
const Food = require("../models/Food");
const Payment = require("../models/Payment");

// Initialize Razorpay Client
let razorpay;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
} else {
  console.warn("[paymentController] RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET missing. Running in simulated payment mode.");
}

// Create Razorpay Order
exports.createOrder = async (req, res) => {
  try {
    const { amount, orderId = `TXN-${Date.now()}` } = req.body;
    
    if (!amount) {
      return res.status(400).json({ message: "Amount is required" });
    }

    let razorpayOrderId = "";
    const isMock = !razorpay;

    if (isMock) {
      razorpayOrderId = `mock_order_${Date.now()}`;
      console.log(`[paymentController] Running in mock mode. Generated order ID: ${razorpayOrderId}`);
    } else {
      try {
        const amountInPaise = Math.round(parseFloat(amount) * 100);
        const razorpayOrder = await razorpay.orders.create({
          amount: amountInPaise,
          currency: "INR",
          receipt: orderId,
          notes: {
            orderId,
            userId: req.user._id.toString()
          }
        });
        razorpayOrderId = razorpayOrder.id;
        console.log(`[paymentController] Razorpay Order created successfully: ${razorpayOrderId}`);
      } catch (err) {
        console.error("[paymentController] Razorpay Order creation failed:", err.message);
        return res.status(400).json({ message: `Razorpay Order creation failed: ${err.message}` });
      }
    }

    res.status(200).json({
      success: true,
      key: process.env.RAZORPAY_KEY_ID || "rzp_test_mockkeyid12345",
      order: {
        id: razorpayOrderId,
        amount: Math.round(parseFloat(amount) * 100),
        currency: "INR"
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Secure backend verification of payment status and creating verified order
exports.verifyPayment = async (req, res) => {
  try {
    const { 
      razorpay_payment_id, 
      razorpay_order_id, 
      razorpay_signature,
      amount, 
      paymentMethod,
      orderData 
    } = req.body;

    if (!paymentMethod) {
      return res.status(400).json({ message: "Payment method is required" });
    }

    // Prevent duplicate verification
    if (razorpay_payment_id) {
      const existingOrder = await Order.findOne({ transactionId: razorpay_payment_id });
      if (existingOrder) {
        console.log(`[paymentController] Order already verified for paymentId: "${razorpay_payment_id}". Returning existing order.`);
        return res.status(200).json(existingOrder);
      }
    }
    
    let isVerified = false;
    let actualPaymentId = razorpay_payment_id || `pay_mock_${Date.now()}`;
    let actualSignature = razorpay_signature || "verified_sig";

    const isMock = !razorpay || razorpay_order_id?.startsWith("mock_");

    if (isMock) {
      isVerified = true;
      console.log("[paymentController] Mock order signature bypass verified.");
    } else {
      try {
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
          .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
          .update(body)
          .digest("hex");
        
        isVerified = expectedSignature === razorpay_signature;
        if (isVerified) {
          console.log(`[paymentController] HMAC signature verification succeeded for payment: ${razorpay_payment_id}`);
        } else {
          console.error(`[paymentController] HMAC signature verification failed for payment: ${razorpay_payment_id}`);
        }
      } catch (err) {
        console.error("[paymentController] Signature verification failed:", err.message);
      }
    }

    if (!isVerified) {
      return res.status(400).json({ message: "Payment verification failed. Invalid signature." });
    }

    // Securely create order inside database
    if (orderData) {
      const { restaurant, items, address, discount, deliveryCharge, tax, totalAmount, couponCode } = orderData;
      const orderNumber = `ORD-${Date.now()}`;
      
      const mongoose = require("mongoose");
      const Restaurant = require("../models/Restaurant");

      let finalRestaurantId = restaurant;
      if (!mongoose.Types.ObjectId.isValid(restaurant)) {
        const defaultRest = await Restaurant.findOne();
        if (defaultRest) finalRestaurantId = defaultRest._id;
      }

      const validItems = [];
      for (const item of items) {
        let finalFoodId = item.food;
        if (!mongoose.Types.ObjectId.isValid(item.food)) {
          const defaultFood = await Food.findOne({ restaurant: finalRestaurantId }) || await Food.findOne();
          if (defaultFood) finalFoodId = defaultFood._id;
        }
        validItems.push({
          food: finalFoodId,
          quantity: item.quantity || 1,
          price: item.price || 0,
        });
      }
      
      const subtotal = validItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      if (couponCode) {
        const Coupon = require("../models/Coupon");
        const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
        if (!coupon) {
          return res.status(400).json({ message: "Invalid coupon code" });
        }
        if (!coupon.active || coupon.status !== "Active") {
          return res.status(400).json({ message: "This coupon is no longer active" });
        }
        if (coupon.expiresAt && new Date() >= coupon.expiresAt) {
          return res.status(400).json({ message: "This coupon has expired" });
        }
        if (coupon.userId && coupon.userId.toString() !== req.user._id.toString()) {
          return res.status(400).json({ message: "This coupon is private and cannot be used by this account" });
        }
        if (subtotal < coupon.minOrderAmount) {
          return res.status(400).json({ message: `Minimum order amount of ₹${coupon.minOrderAmount} required for this coupon` });
        }
      }

      const order = await Order.create({
        user: req.user._id,
        customerName: req.user.name,
        customerEmail: req.user.email,
        customerPhone: req.user.phone,
        restaurant: finalRestaurantId,
        items: validItems,
        address,
        paymentMethod,
        paymentStatus: "Paid",
        status: "Confirmed",
        paidAt: new Date(),
        discount: discount || 0,
        deliveryCharge: deliveryCharge !== undefined ? deliveryCharge : 40,
        tax: tax || 0,
        totalAmount: totalAmount || amount,
        orderNumber,
        transactionId: actualPaymentId,
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: actualPaymentId,
        razorpaySignature: actualSignature,
      });

      // Save payment transaction history log
      await Payment.create({
        orderId: order._id,
        paymentId: actualPaymentId,
        razorpayOrderId: razorpay_order_id,
        amount: totalAmount || amount,
        currency: "INR",
        paymentMethod: "Razorpay Online",
        paymentStatus: "Captured",
        userId: req.user._id,
      });

      // Update food inventory stock
      try {
        for (const item of validItems) {
          await Food.findByIdAndUpdate(item.food, {
            $inc: { stock: -item.quantity }
          });
        }
      } catch (err) {
        console.error("Error updating inventory stock:", err.message);
      }

      // Mark coupon as used if applied
      if (couponCode) {
        try {
          const Coupon = require("../models/Coupon");
          await Coupon.findOneAndUpdate(
            { code: couponCode.toUpperCase(), status: "Active" },
            {
              $set: {
                status: "Used",
                usedAt: new Date(),
                orderId: order._id,
                active: false
              }
            }
          );
        } catch (err) {
          console.error("Error marking coupon as used:", err.message);
        }
      }

      console.log(`[paymentController] Order placed successfully: ${order.orderNumber} for user: ${req.user.email}`);
      return res.status(201).json(order);
    }

    res.status(200).json({ status: "success", verified: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Retrieve Payment Status
exports.getPaymentStatus = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const payment = await Payment.findOne({ paymentId }).populate("orderId");
    if (!payment) {
      if (razorpay) {
        try {
          const rzpPayment = await razorpay.payments.fetch(paymentId);
          return res.json({ success: true, status: rzpPayment.status, details: rzpPayment });
        } catch (e) {
          return res.status(404).json({ success: false, message: "Payment not found in DB or Razorpay" });
        }
      }
      return res.status(404).json({ success: false, message: "Payment record not found" });
    }
    res.json({ success: true, status: payment.paymentStatus, details: payment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
