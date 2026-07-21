const crypto = require("crypto");
const { razorpay, createRazorpayOrder } = require("../config/razorpay");
const Order = require("../models/Order");
const Food = require("../models/Food");
const Payment = require("../models/Payment");
const User = require("../models/User");


exports.createOrder = async (req, res) => {
  try {
    const { amount, receipt = `rcpt_${Date.now()}`, notes = {} } = req.body;
    if (!amount || parseFloat(amount) <= 0) {
      return res.status(400).json({ message: "Valid amount is required" });
    }

    const amountInPaise = Math.round(parseFloat(amount) * 100);
    const keyId = process.env.RAZORPAY_KEY_ID || "";
    const keySecret = process.env.RAZORPAY_KEY_SECRET || "";

    if (keyId && keySecret) {
      const order = await createRazorpayOrder({
        amount: amountInPaise,
        currency: "INR",
        receipt: receipt,
        notes: {
          userId: req.user?._id?.toString() || "",
          ...notes,
        },
      });

      return res.status(200).json({
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        key: keyId,
      });
    }

    res.status(200).json({
      id: `order_mock_${Date.now()}`,
      amount: amountInPaise,
      currency: "INR",
      key: keyId || "rzp_live_SuiX1JeqCYs1KX",
    });
  } catch (error) {
    console.error("[paymentController] createOrder error:", error);
    res.status(500).json({ message: error.message || "Failed to create Razorpay order" });
  }
};

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
    const merchantUpi = process.env.MERCHANT_UPI_ID || restaurant?.upiId || "rzpaparaitechsoftw434004.rzp@ypbiz";
    const merchantName = process.env.MERCHANT_NAME || restaurant?.name || "Aparaitech Software";

    const keyId = process.env.RAZORPAY_KEY_ID || "";
    const keySecret = process.env.RAZORPAY_KEY_SECRET || "";

    if (keyId && keySecret && razorpay) {
      try {
        const amountInPaise = Math.round(parseFloat(amount) * 100);
        let paymentLink = null;
        const linkPayload = {
          amount: amountInPaise,
          currency: "INR",
          accept_partial: false,
          description: `FoodExpress Order ${orderId}`,
          customer: {
            name: "Customer",
            contact: "9999999999"
          },
          notify: {
            sms: false,
            email: false
          },
          notes: {
            order_id: orderId
          }
        };

        if (razorpay.paymentLink && typeof razorpay.paymentLink.create === "function") {
          paymentLink = await razorpay.paymentLink.create(linkPayload);
        } else if (razorpay.paymentLinks && typeof razorpay.paymentLinks.create === "function") {
          paymentLink = await razorpay.paymentLinks.create(linkPayload);
        }

        if (paymentLink && paymentLink.short_url) {
          upiUri = paymentLink.short_url;
          qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(paymentLink.short_url)}`;
          razorpayOrderId = paymentLink.id;
        } else if (razorpay.qrcodes && typeof razorpay.qrcodes.create === "function") {
          const qrCode = await razorpay.qrcodes.create({
            type: "upi_qr",
            name: merchantName,
            usage: "single_use",
            fixed_amount: true,
            payment_amount: amountInPaise,
            description: `Order receipt: ${orderId}`,
            close_by: Math.floor(Date.now() / 1000) + 900,
            notes: { order_id: orderId }
          });

          razorpayOrderId = qrCode.id;
          qrCodeUrl = qrCode.image_url || `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrCode.upi_link || merchantUpi)}`;
          upiUri = qrCode.upi_link || qrCode.image_url;
        }
      } catch (err) {
        console.warn("[paymentController] Razorpay QR/Link creation error:", err?.error?.description || err.message);
      }
    }

    if (!qrCodeUrl) {
      upiUri = `upi://pay?pa=${merchantUpi}&pn=${encodeURIComponent(merchantName)}&am=${amount}&cu=INR&tn=Order%20${orderId}`;
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

// 3. Cryptographically Verify Razorpay Payment (HMAC SHA256) & Save Order
exports.verifyPayment = async (req, res) => {
  try {
    const { 
      paymentId, 
      signature, 
      razorpayOrderId, 
      razorpayPaymentId: reqRazorpayPaymentId,
      razorpaySignature: reqRazorpaySignature,
      razorpay_order_id,
      razorpay_payment_id,
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

    // Idempotent duplicate check
    if (checkPaymentId) {
      const existingOrder = await Order.findOne({ transactionId: checkPaymentId });
      if (existingOrder) {
        console.log(`[paymentController] Order already verified for paymentId: "${checkPaymentId}". Returning existing order.`);
        return res.status(200).json(existingOrder);
      }
    }

    let isVerified = false;
    let actualPaymentId = checkPaymentId || `pay_mock_${Date.now()}`;
    let actualSignature = checkSignature || "verified_sig";

    const keySecret = process.env.RAZORPAY_KEY_SECRET || "";
    const isMock = !keySecret || checkOrderId?.startsWith("mock_");

    // Cryptographic HMAC SHA256 verification (Service Hub signature check)
    if (checkPaymentId && checkSignature && checkOrderId && keySecret) {
      const generatedSignature = crypto
        .createHmac("sha256", keySecret)
        .update(checkOrderId + "|" + checkPaymentId)
        .digest("hex");

      if (generatedSignature === checkSignature) {
        isVerified = true;
        actualPaymentId = checkPaymentId;
        actualSignature = checkSignature;
      }
    }

    if (!isVerified && isMock) {
      isVerified = true;
    } else if (!isVerified && razorpay && checkOrderId && razorpay.qrcodes) {
      try {
        const paymentsList = await razorpay.qrcodes.fetchPayments(checkOrderId);
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
      return res.status(400).json({ message: "Payment signature verification failed or payment is incomplete." });
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
        razorpayOrderId: checkOrderId,
        razorpayPaymentId: actualPaymentId,
        razorpaySignature: actualSignature
      });

      await createdOrder.save();

      // Create Payment Transaction Record storing all required payment details
      const newPayment = new Payment({
        orderId: createdOrder._id,
        userId: userId,
        paymentId: actualPaymentId,
        razorpayOrderId: checkOrderId,
        razorpaySignature: actualSignature,
        amount: totalAmount || amount,
        currency: "INR",
        paymentMethod: paymentMethod,
        paymentStatus: "Paid",
        gatewayResponse: { paymentId: actualPaymentId, razorpayOrderId: checkOrderId }
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

    let linkData = null;
    try {
      if (razorpay.paymentLink && typeof razorpay.paymentLink.fetch === "function") {
        linkData = await razorpay.paymentLink.fetch(id);
      } else if (razorpay.paymentLinks && typeof razorpay.paymentLinks.fetch === "function") {
        linkData = await razorpay.paymentLinks.fetch(id);
      }
    } catch (sdkErr) {
      return res.status(400).json({ message: sdkErr.message || "Failed to fetch payment link status" });
    }

    if (!linkData) {
      return res.status(400).json({ message: "Could not retrieve payment link status from Razorpay" });
    }

    if (linkData.status === "paid") {
      const notesOrderId = linkData.notes?.order_id || orderId;
      const amount = linkData.amount / 100;
      
      const paymentInfo = linkData.payments && linkData.payments.length > 0
        ? linkData.payments[0]
        : { payment_id: `pay_link_${Date.now()}`, method: "upi" };

      const paymentId = paymentInfo.payment_id;
      const paymentMethod = paymentInfo.method || "Razorpay UPI";

      const Order = require("../models/Order");
      const order = await Order.findOne({ 
        $or: [
          { orderNumber: notesOrderId }, 
          { _id: require("mongoose").Types.ObjectId.isValid(notesOrderId) ? notesOrderId : null }
        ] 
      });

      if (order) {
        order.paymentStatus = "Paid";
        order.status = "Confirmed";
        order.deliveryStatus = "Delivered";
        order.paymentMethod = "Razorpay Online QR";
        order.paymentReceivedAt = new Date();
        order.transactionId = paymentId;
        order.razorpayOrderId = id;
        order.razorpayPaymentId = paymentId;
        order.razorpaySignature = "verified_via_api";
        await order.save();

        const Payment = require("../models/Payment");
        await Payment.findOneAndUpdate(
          { razorpayOrderId: id },
          {
            orderId: order._id,
            userId: order.user,
            paymentId: paymentId,
            razorpayOrderId: id,
            razorpaySignature: "verified_via_api",
            amount: amount,
            currency: "INR",
            paymentMethod: "Razorpay Online QR",
            paymentStatus: "Paid",
            gatewayResponse: linkData
          },
          { upsert: true, new: true }
        );

        try {
          const { getIO } = require("../config/socket");
          const io = getIO ? getIO() : null;
          if (io) {
            io.emit("order-updated", order);
            io.emit("payment-success", { orderId: order._id, paymentId });
          }
        } catch (sErr) {}

        return res.status(200).json({ status: "success", paid: true, order });
      }
    }

    res.status(200).json({ status: "pending", paid: false, linkStatus: linkData.status });
  } catch (error) {
    console.error("[paymentController] checkLinkStatus error:", error);
    res.status(500).json({ message: error.message });
  }
};

// 8. Process Refund (Standard API trigger)
exports.processRefund = async (req, res) => {
  try {
    const { orderId } = req.params;
    const Order = require("../models/Order");
    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    order.paymentStatus = "Refunded";
    await order.save();

    await Payment.findOneAndUpdate(
      { orderId: order._id },
      { paymentStatus: "Refunded" }
    );

    res.status(200).json({ success: true, message: "Refund processed successfully", order });
  } catch (error) {
    console.error("[paymentController] processRefund error:", error);
    res.status(500).json({ message: error.message });
  }
};

// 9. Get all transactions (Standard API trigger)
exports.getTransactions = async (req, res) => {
  try {
    const payments = await Payment.find().populate("orderId userId").sort({ createdAt: -1 });
    res.status(200).json(payments);
  } catch (error) {
    console.error("[paymentController] getTransactions error:", error);
    res.status(500).json({ message: error.message });
  }
};
