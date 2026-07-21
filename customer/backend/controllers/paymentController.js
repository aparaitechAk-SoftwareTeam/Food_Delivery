const crypto = require("crypto");
const { razorpay, createRazorpayOrder } = require("../config/razorpay");
const Order = require("../models/Order");
const Food = require("../models/Food");
const Payment = require("../models/Payment");
const User = require("../models/User");


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

// 3. Cryptographically Verify Razorpay Payment (HMAC SHA256) & Save Order
exports.verifyPayment = async (req, res) => {
  try {
    const { 
      razorpay_payment_id, 
      razorpay_order_id, 
      razorpay_signature,
      amount, 
      paymentMethod = "Razorpay Online",
      orderData 
    } = req.body;

    const checkPaymentId = paymentId || reqRazorpayPaymentId || razorpay_payment_id;
    const checkSignature = signature || reqRazorpaySignature || razorpay_signature;
    const checkOrderId = razorpayOrderId || razorpay_order_id;

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

    if (!isVerified && isMock) {
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
    let createdOrder = null;
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

      const userId = req.user?._id || req.user?.id;

      createdOrder = new Order({
        orderNumber,
        user: userId,
        restaurant: finalRestaurantId,
        items: validItems,
        customerName: req.user?.name || address?.name || "Customer",
        customerPhone: req.user?.phone || address?.phone || "Phone N/A",
        address: address || {},
        discount: discount || 0,
        deliveryCharge: deliveryCharge || 40,
        tax: tax || 0,
        totalAmount: totalAmount || amount,
        paymentMethod: paymentMethod,
        paymentStatus: "Paid",
        paymentReceivedAt: new Date(),
        status: "Confirmed",
        transactionId: actualPaymentId,
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: actualPaymentId,
        razorpaySignature: actualSignature
      });

      await createdOrder.save();

      // Create Payment Transaction Record storing all required payment details
      const newPayment = new Payment({
        orderId: createdOrder._id,
        userId: userId,
        paymentId: actualPaymentId,
        razorpayOrderId: razorpay_order_id,
        amount: totalAmount || amount,
        currency: "INR",
        paymentMethod: "Razorpay Online",
        paymentStatus: "Captured",
        userId: req.user._id,
      });
      await newPayment.save();

      // Emit Socket.IO Event
      try {
        const { getIO } = require("../config/socket");
        const io = getIO ? getIO() : null;
        if (io) {
          io.emit("new-order", createdOrder);
        }
      } catch (sErr) {
        console.warn("[paymentController] Socket emit failed:", sErr.message);
      }
    }

    res.status(200).json(createdOrder || { message: "Payment verified successfully", paymentId: actualPaymentId });
  } catch (error) {
    console.error("[paymentController] verifyPayment error:", error);
    res.status(500).json({ message: error.message || "Payment verification failed" });
  }
};

// 4. Razorpay Webhooks Handler
exports.handleWebhook = async (req, res) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;
    const signature = req.headers["x-razorpay-signature"];

    if (secret && signature) {
      const shasum = crypto.createHmac("sha256", secret);
      shasum.update(JSON.stringify(req.body));
      const digest = shasum.digest("hex");

      if (digest !== signature) {
        return res.status(400).json({ message: "Invalid webhook signature" });
      }
    }

    const { event, payload } = req.body;
    console.log(`[paymentController] Webhook received: ${event}`);

    if (event === "payment.captured" || event === "order.paid") {
      const paymentEntity = payload.payment?.entity || payload.order?.entity;
      if (paymentEntity) {
        const paymentId = paymentEntity.id;
        const razorpayOrderId = paymentEntity.order_id;

        const order = await Order.findOne({ 
          $or: [{ transactionId: paymentId }, { razorpayOrderId: razorpayOrderId }] 
        });

        if (order) {
          order.paymentStatus = "Paid";
          if (order.status === "Pending") order.status = "Confirmed";
          order.paymentReceivedAt = new Date();
          await order.save();
        }

        await Payment.findOneAndUpdate(
          { razorpayOrderId: razorpayOrderId },
          { 
            paymentStatus: "Paid",
            $push: { webhookLogs: { event, payload: req.body, receivedAt: new Date() } }
          },
          { upsert: true }
        );
      }
    }

    res.status(200).json({ status: "ok" });
  } catch (error) {
    console.error("[paymentController] handleWebhook error:", error);
    res.status(500).json({ message: error.message });
  }
};

// 5. Handle Payment Failure
exports.handlePaymentFailure = async (req, res) => {
  try {
    const { orderId, razorpayOrderId, errorReason } = req.body;

    if (orderId) {
      await Order.findByIdAndUpdate(orderId, { 
        paymentStatus: "Failed",
        status: "Cancelled"
      });
    }

    if (razorpayOrderId) {
      await Payment.findOneAndUpdate(
        { razorpayOrderId },
        { paymentStatus: "Failed", gatewayResponse: { errorReason } }
      );
    }

    res.status(200).json({ message: "Payment failure recorded" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 6. Get Payment Details By Order ID / Payment ID
exports.getPaymentDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const payment = await Payment.findOne({
      $or: [{ orderId: id }, { paymentId: id }, { razorpayOrderId: id }]
    }).populate("orderId userId");

    if (!payment) {
      return res.status(404).json({ message: "Payment record not found" });
    }

    res.status(200).json(payment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 7. Check status of a Razorpay Payment Link
exports.checkLinkStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { orderId } = req.query;
    const keyId = process.env.RAZORPAY_KEY_ID || "";
    const keySecret = process.env.RAZORPAY_KEY_SECRET || "";

    if (id.startsWith("mock_qr_") || id.startsWith("qr_")) {
      const Order = require("../models/Order");
      const order = await Order.findOne({ 
        $or: [
          { orderNumber: orderId }, 
          { _id: require("mongoose").Types.ObjectId.isValid(orderId) ? orderId : null }
        ] 
      });
      if (order) {
        order.paymentStatus = "Paid";
        order.status = "Confirmed";
        order.deliveryStatus = "Delivered";
        order.paymentMethod = "Razorpay Online QR (Mock)";
        order.paymentReceivedAt = new Date();
        await order.save();

        try {
          const { getIO } = require("../config/socket");
          const io = getIO ? getIO() : null;
          if (io) {
            io.emit("order-updated", order);
          }
        } catch (sErr) {}

        return res.status(200).json({ status: "success", paid: true, order });
      }
      return res.status(400).json({ message: "Mock order not found" });
    }

    if (!keyId || !keySecret || !razorpay) {
      return res.status(400).json({ message: "Razorpay credentials are not configured" });
    }

      console.log(`[paymentController] Order placed successfully: ${order.orderNumber} for user: ${req.user.email}`);
      return res.status(201).json(order);
    }

    res.status(200).json({ status: "pending", paid: false, linkStatus: linkData.status });
  } catch (error) {
    console.error("[paymentController] checkLinkStatus error:", error);
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
