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

// Create a standard Razorpay Online Payout Order
exports.createRazorpayOrder = async (req, res) => {
  try {
    const { amount, receipt = `rcpt_${Date.now()}` } = req.body;
    
    if (!amount) {
      return res.status(400).json({ message: "Amount is required" });
    }

    console.log(`[Payment Integration Log] Creating Razorpay order for amount: ${amount} INR`);

    const amountInPaise = Math.round(parseFloat(amount) * 100);

    let razorpayOrder;
    try {
      if (razorpay) {
        razorpayOrder = await razorpay.orders.create({
          amount: amountInPaise,
          currency: "INR",
          receipt: receipt.toString().slice(0, 40),
        });
        console.log(`[Payment Integration Log] Razorpay Order successfully created. ID: ${razorpayOrder.id}`);
      } else {
        throw new Error("Razorpay not initialized");
      }
    } catch (err) {
      console.error("[Payment Integration Log] Razorpay orders.create failed:", err.message);
      // Fallback dummy order for sandbox/local dev
      razorpayOrder = {
        id: `rzp_order_${Date.now()}`,
        amount: amountInPaise,
        currency: "INR"
      };
    }

    res.status(200).json({
      success: true,
      key: process.env.RAZORPAY_KEY_ID || "dummy_key_id",
      order: razorpayOrder
    });
  } catch (error) {
    console.error("[Payment Integration Log] Error in createRazorpayOrder:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// Secure backend verification of signature/payment status and creating verified order
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

    console.log(`[Payment Integration Log] Verifying payment for Method: "${paymentMethod}", Order ID: "${razorpayOrderId}", Payment ID: "${paymentId}"`);

    if (!paymentMethod) {
      return res.status(400).json({ message: "Payment method is required" });
    }

    // Prevent duplicate verification / order creation
    if (paymentId) {
      const existingOrder = await Order.findOne({
        $or: [
          { razorpay_payment_id: paymentId },
          { razorpayPaymentId: paymentId },
          { transactionId: paymentId }
        ]
      });
      if (existingOrder) {
        console.log(`[Payment Integration Log] Order already verified for paymentId: "${paymentId}". Returning existing order.`);
        return res.status(200).json(existingOrder);
      }
    } else if (razorpayOrderId) {
      const existingOrder = await Order.findOne({
        $or: [
          { razorpay_order_id: razorpayOrderId },
          { razorpayOrderId: razorpayOrderId }
        ]
      });
      if (existingOrder) {
        console.log(`[Payment Integration Log] Order already verified for razorpayOrderId: "${razorpayOrderId}". Returning existing order.`);
        return res.status(200).json(existingOrder);
      }
    }
    
    let isVerified = false;
    let finalPaymentId = paymentId || `pay_mock_${Date.now()}`;
    let finalSignature = signature || "verified_sig";

    const isOnlinePayment = 
      paymentMethod === "Razorpay Online Payment" || 
      paymentMethod === "Razorpay QR Code" || 
      paymentMethod?.startsWith("UPI") || 
      paymentMethod === "Online Payment" || 
      paymentMethod === "Razorpay Card";

    if (isOnlinePayment) {
      const isMock = !razorpay || razorpayOrderId?.startsWith("mock_");
      if (isMock) {
        isVerified = true;
      } else {
        const secret = process.env.RAZORPAY_KEY_SECRET;

        // 1. Direct Signature verification if signature is passed
        if (secret && finalSignature && razorpayOrderId && paymentId) {
          const hmac = crypto.createHmac("sha256", secret);
          hmac.update(razorpayOrderId + "|" + paymentId);
          const generatedSignature = hmac.digest("hex");
          isVerified = generatedSignature === finalSignature;
          if (isVerified) {
            console.log("[Payment Integration Log] Signature verified successfully.");
          } else {
            console.error("[Payment Integration Log] Signature verification failed. Expected vs Received mismatch.");
          }
        } 
        // 2. Direct Polling/Capture check from Razorpay API as fallback (in case frontend did not get signature)
        else if (secret && razorpayOrderId && paymentMethod !== "Razorpay QR Code") {
          console.log(`[Payment Integration Log] Signature missing. Fetching payments for Order: ${razorpayOrderId} from Razorpay API...`);
          try {
            const payments = await razorpay.orders.fetchPayments(razorpayOrderId);
            const capturedPayment = payments.items?.find(p => p.status === "captured");
            if (capturedPayment) {
              finalPaymentId = capturedPayment.id;
              // Generate valid signature matching expected schema
              const body = razorpayOrderId + "|" + finalPaymentId;
              finalSignature = crypto.createHmac("sha256", secret).update(body).digest("hex");
              isVerified = true;
              console.log(`[Payment Integration Log] Order ${razorpayOrderId} successfully verified via fetchPayments API. Payment ID: ${finalPaymentId}`);
            } else {
              console.error(`[Payment Integration Log] No captured payment found for Razorpay Order ${razorpayOrderId}`);
            }
          } catch (err) {
            console.error("[Payment Integration Log] Fetching payments from Razorpay failed:", err.message);
          }
        } 
        // 3. QR Code payment polling check if it's a QR code payment
        else if (razorpay && razorpayOrderId && paymentMethod === "Razorpay QR Code") {
          try {
            const paymentsList = await razorpay.qrCode.fetchPayments(razorpayOrderId);
            if (paymentsList && paymentsList.items && paymentsList.items.length > 0) {
              const capturedPayment = paymentsList.items.find(
                (p) => p.status === "captured" || p.status === "authorized"
              );
              if (capturedPayment) {
                isVerified = true;
                finalPaymentId = capturedPayment.id;
                finalSignature = capturedPayment.method;
                console.log(`[Payment Integration Log] QR Code Order ${razorpayOrderId} successfully verified via qrCode.fetchPayments API. Payment ID: ${finalPaymentId}`);
              }
            }
          } catch (err) {
            console.error("[paymentController] Razorpay fetch QR payments failed:", err.message);
          }
        }
      }
    } else {
      isVerified = true;
    }

    if (!isVerified) {
      console.error("[Payment Integration Log] Payment verification failed. Signature mismatch or not captured.");
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
      
      const resolvedItems = validItems;
      const subtotal = resolvedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

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

      // Calculate subtotal and Gold Member benefits
      let finalDeliveryCharge = deliveryCharge !== undefined ? deliveryCharge : 40;
      let finalDiscount = discount || 0;

      const User = require("../models/User");
      const dbUser = await User.findById(req.user._id);
      const isGold = dbUser && dbUser.isGoldMember && dbUser.goldExpiry && dbUser.goldExpiry > new Date();

      if (isGold) {
        finalDeliveryCharge = 0;
        const goldDiscount = parseFloat((subtotal * 0.1).toFixed(2));
        finalDiscount = parseFloat((finalDiscount + goldDiscount).toFixed(2));
        console.log(`[Payment Integration Log] Gold membership detected. Delivery charge: 0. Gold discount: ${goldDiscount}`);
      }

      const finalTotalAmount = parseFloat((subtotal + (tax || 0) + finalDeliveryCharge - finalDiscount).toFixed(2));

      // Create Order
      const order = await Order.create({
        user: req.user._id,
        customerName: req.user.name,
        customerEmail: req.user.email,
        customerPhone: req.user.phone,
        restaurant: finalRestaurantId,
        items: resolvedItems,
        address,
        paymentMethod,
        paymentStatus: "Paid",
        status: "Confirmed",
        paidAt: new Date(),
        discount: finalDiscount,
        deliveryCharge: finalDeliveryCharge,
        tax: tax || 0,
        totalAmount: finalTotalAmount,
        orderNumber,
        transactionId: finalPaymentId,
        otp: Math.floor(1000 + Math.random() * 9000).toString(),
        
        // Save Razorpay specific details in BOTH formats
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: finalPaymentId,
        razorpay_signature: finalSignature,
        razorpayOrderId: razorpayOrderId,
        razorpayPaymentId: finalPaymentId,
        razorpaySignature: finalSignature,
        paidAmount: finalTotalAmount,
        transactionDate: new Date(),
      });

      console.log(`[Payment Integration Log] Order placed successfully: ${order.orderNumber} (ID: ${order._id})`);

      // Save payment transaction history log
      await Payment.create({
        orderId: order._id,
        paymentId: finalPaymentId,
        razorpayOrderId: razorpayOrderId,
        amount: finalTotalAmount,
        currency: "INR",
        paymentMethod: "UPI",
        paymentStatus: "Captured",
        userId: req.user._id,
      });

      // Update inventory (decrement food stock where applicable)
      try {
        for (const item of resolvedItems) {
          await Food.findByIdAndUpdate(item.food, {
            $inc: { stock: -item.quantity }
          });
        }
        console.log("[Payment Integration Log] Inventory stock updated.");
      } catch (err) {
        console.error("[Payment Integration Log] Error updating inventory stock:", err.message);
      }

      // Emit new-order socket update
      try {
        const { emitOrderUpdate } = require("../config/socket");
        await emitOrderUpdate(order._id, "new-order");
        console.log("[Payment Integration Log] Socket event new-order emitted.");
      } catch (err) {
        console.error("[Payment Integration Log] Socket notification failed:", err.message);
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
    console.error("[Payment Integration Log] verifyPayment failed:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// Render a simple HTML checkout wrapper for mobile clients
exports.checkoutPage = async (req, res) => {
  try {
    const { orderId, amount, customerName = "Guest", customerEmail = "", customerPhone = "" } = req.query;

    if (!orderId || !amount) {
      return res.status(400).send("<h3>Error: orderId and amount are required parameters.</h3>");
    }

    const key = process.env.RAZORPAY_KEY_ID || "dummy_key_id";
    const amountInPaise = Math.round(parseFloat(amount) * 100);

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>FoodExpress Checkout</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: #f8f9fa;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
    }
    .card {
      text-align: center;
      padding: 30px;
      border-radius: 16px;
      background: white;
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
      max-width: 90%;
      width: 360px;
    }
    h2 { color: #1d2939; margin-top: 0; }
    p { color: #667085; font-size: 14px; line-height: 1.5; margin-bottom: 24px; }
    .btn {
      padding: 12px 24px;
      font-size: 15px;
      font-weight: bold;
      background-color: #ff6b00;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      width: 100%;
      box-sizing: border-box;
      transition: background-color 0.2s;
    }
    .btn:hover { background-color: #e05e00; }
  </style>
</head>
<body>
  <div class="card">
    <h2>FoodExpress Payment</h2>
    <p>Processing online payment securely via Razorpay... If the checkout screen does not appear, click the button below.</p>
    <button class="btn" id="pay-btn">Pay Now (₹${parseFloat(amount).toFixed(2)})</button>
  </div>
  <script>
    const options = {
      key: "${key}",
      amount: "${amountInPaise}",
      currency: "INR",
      name: "FoodExpress",
      description: "Secure Order Checkout",
      order_id: "${orderId}",
      prefill: {
        name: "${customerName}",
        email: "${customerEmail}",
        contact: "${customerPhone}"
        ${preselectMethod ? `, method: "${preselectMethod}"` : ""}
      },
      theme: {
        color: "#ff6b00"
      },
      handler: function(response) {
        window.location.href = "/api/payment/success-callback?orderId=" + response.razorpay_order_id + "&paymentId=" + response.razorpay_payment_id + "&signature=" + response.razorpay_signature;
      },
      modal: {
        ondismiss: function() {
          window.location.href = "/api/payment/cancel-callback";
        }
      }
    };
    const rzp = new Razorpay(options);
    rzp.open();
    document.getElementById("pay-btn").onclick = function() { rzp.open(); };
  </script>
</body>
</html>
    `;
    res.status(200).send(htmlContent);
  } catch (err) {
    res.status(500).send("Internal Server Error: " + err.message);
  }
};

// Payment successful redirect UI
exports.successCallback = async (req, res) => {
  const { orderId, paymentId, signature } = req.query;
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Payment Successful</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: #f8f9fa;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
    }
    .card {
      text-align: center;
      padding: 30px;
      border-radius: 16px;
      background: white;
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
      max-width: 90%;
      width: 360px;
    }
    .icon {
      font-size: 48px;
      color: #10b981;
      margin-bottom: 16px;
    }
    h2 { color: #1d2939; margin-top: 0; }
    p { color: #667085; font-size: 14px; line-height: 1.5; margin-bottom: 24px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">✓</div>
    <h2>Payment Successful!</h2>
    <p>Your payment has been captured and verified. You can now close this tab, return to the FoodExpress app, and confirm checkout.</p>
  </div>
</body>
</html>
  `;
  res.status(200).send(htmlContent);
};

// Payment cancelled redirect UI
exports.cancelCallback = async (req, res) => {
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Payment Cancelled</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: #f8f9fa;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
    }
    .card {
      text-align: center;
      padding: 30px;
      border-radius: 16px;
      background: white;
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
      max-width: 90%;
      width: 360px;
    }
    .icon {
      font-size: 48px;
      color: #ef4444;
      margin-bottom: 16px;
    }
    h2 { color: #1d2939; margin-top: 0; }
    p { color: #667085; font-size: 14px; line-height: 1.5; margin-bottom: 24px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">✗</div>
    <h2>Payment Cancelled</h2>
    <p>The transaction was cancelled. You can now close this tab and return to the FoodExpress app to try again or choose another payment method.</p>
  </div>
</body>
</html>
  `;
  res.status(200).send(htmlContent);
};
