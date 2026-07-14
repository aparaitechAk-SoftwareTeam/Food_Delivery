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

// Generate Razorpay UPI QR Code URL
exports.generateQR = async (req, res) => {
  try {
    const { amount, orderId = `TXN-${Date.now()}` } = req.body;
    
    if (!amount) {
      return res.status(400).json({ message: "Amount is required" });
    }

    let qrCodeUrl = "";
    let upiUri = "";
    let razorpayOrderId = "";

    const Restaurant = require("../models/Restaurant");
    const restaurant = await Restaurant.findOne();
    const merchantUpi = restaurant?.upiId || "CloudKitchen@okaxis";
    const merchantName = restaurant?.name || "FoodExpress Premium Kitchen";

    if (razorpay) {
      try {
        const amountInPaise = Math.round(parseFloat(amount) * 100);
        
        // 1. Create a Razorpay Order
        const razorpayOrder = await razorpay.orders.create({
          amount: amountInPaise,
          currency: "INR",
          receipt: orderId
        });

        // 2. Generate UPI QR Code associated with this order
        const qrCode = await razorpay.qrCode.create({
          type: "upi_qr",
          name: merchantName,
          usage: "single_use",
          fixed_amount: true,
          amount: amountInPaise,
          description: `Order receipt: ${orderId}`,
          close_by: Math.floor(Date.now() / 1000) + 900, // 15 mins expiry
          notes: {
            order_id: orderId,
            razorpay_order_id: razorpayOrder.id
          }
        });

        qrCodeUrl = qrCode.image_url;
        razorpayOrderId = qrCode.id;
        upiUri = qrCode.payment_amount ? `upi://pay?pa=${merchantUpi}&pn=${encodeURIComponent(merchantName)}&am=${amount}` : "";
      } catch (err) {
        console.warn("[paymentController] Razorpay API failed to generate QR, falling back to merchant UPI:", err.message);
      }
    }

    // Fallback: scannable merchant UPI code (uses actual settings from admin)
    if (!qrCodeUrl) {
      upiUri = `upi://pay?pa=${merchantUpi}&pn=${encodeURIComponent(merchantName)}&tr=${orderId}&am=${amount}&cu=INR&tn=Order%20${orderId}`;
      qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(upiUri)}`;
      razorpayOrderId = `mock_qr_${Date.now()}`;
    }

    res.status(200).json({
      qr_code_url: qrCodeUrl,
      upi_uri: upiUri,
      razorpay_order_id: razorpayOrderId,
      merchant_name: merchantName,
      amount: parseFloat(amount),
      orderId: orderId,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Secure backend verification of payment status and creating verified order
exports.verifyPayment = async (req, res) => {
  try {
    const { 
      paymentId, 
      signature, 
      razorpayOrderId, 
      amount, 
      paymentMethod,
      orderData 
    } = req.body;

    if (!paymentMethod) {
      return res.status(400).json({ message: "Payment method is required" });
    }

    // Prevent duplicate verification
    if (paymentId) {
      const existingOrder = await Order.findOne({ transactionId: paymentId });
      if (existingOrder) {
        console.log(`[paymentController] Order already verified for paymentId: "${paymentId}". Returning existing order.`);
        return res.status(200).json(existingOrder);
      }
    }
    
    let isVerified = false;
    let actualPaymentId = paymentId || `pay_mock_${Date.now()}`;
    let actualSignature = signature || "verified_sig";

    const isMock = !razorpay || razorpayOrderId?.startsWith("mock_");

    if (isMock) {
      isVerified = true;
    } else {
      try {
        // Retrieve payments made to the specific Razorpay QR Code
        const paymentsList = await razorpay.qrCode.fetchPayments(razorpayOrderId);
        if (paymentsList && paymentsList.items && paymentsList.items.length > 0) {
          const capturedPayment = paymentsList.items.find(
            (p) => p.status === "captured" || p.status === "authorized"
          );
          if (capturedPayment) {
            isVerified = true;
            actualPaymentId = capturedPayment.id;
            actualSignature = capturedPayment.method;
          }
        }
      } catch (err) {
        console.error("[paymentController] Razorpay fetch QR payments failed:", err.message);
      }
    }

    if (!isVerified) {
      return res.status(400).json({ message: "Payment has not been captured/received yet. Please complete the transfer first." });
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
        razorpayOrderId: razorpayOrderId,
        razorpayPaymentId: actualPaymentId,
        razorpaySignature: actualSignature,
      });

      // Save payment transaction history log
      await Payment.create({
        orderId: order._id,
        paymentId: actualPaymentId,
        razorpayOrderId: razorpayOrderId,
        amount: totalAmount || amount,
        currency: "INR",
        paymentMethod: "UPI",
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

      return res.status(201).json(order);
    }

    res.status(200).json({ status: "success", verified: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
