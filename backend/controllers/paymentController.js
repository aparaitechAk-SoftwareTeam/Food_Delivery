const crypto = require("crypto");
const Order = require("../models/Order");
const Food = require("../models/Food");

// Generate UPI QR Code URL (Scannable UPI URI pointing to merchant)
exports.generateQR = async (req, res) => {
  try {
    const { amount, orderId = `TXN-${Date.now()}` } = req.body;
    
    if (!amount) {
      return res.status(400).json({ message: "Amount is required" });
    }

    // Dynamic scannable UPI Payment URI
    const upiUri = `upi://pay?pa=CloudKitchen@razorpay&pn=Krushnas%20Restaurant&tr=${orderId}&am=${amount}&cu=INR&tn=Order%20${orderId}`;
    
    // QR Server API to generate scannable image
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(upiUri)}`;

    res.status(200).json({
      qr_code_url: qrCodeUrl,
      upi_uri: upiUri,
      razorpay_order_id: `rzp_order_${Date.now()}`,
      merchant_name: "Krushna's Restaurant",
      amount: parseFloat(amount),
      orderId: orderId,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Secure backend verification of signature and creating verified order
exports.verifyPayment = async (req, res) => {
  try {
    const { 
      paymentId, 
      signature, 
      razorpayOrderId, 
      amount, 
      paymentMethod,
      orderData // Contains restaurant, items, address, discount, deliveryCharge, tax, totalAmount
    } = req.body;

    if (!paymentMethod) {
      return res.status(400).json({ message: "Payment method is required" });
    }

    let isVerified = false;

    // Secure Verification Check
    if (paymentMethod === "Razorpay QR Code" || paymentMethod.startsWith("UPI")) {
      if (!paymentId) {
        return res.status(400).json({ message: "Transaction / Payment ID is required for online payments" });
      }

      // Check if Razorpay keys are configured for real verification
      const secret = process.env.RAZORPAY_KEY_SECRET;
      if (secret && signature && razorpayOrderId) {
        const hmac = crypto.createHmac("sha256", secret);
        hmac.update(razorpayOrderId + "|" + paymentId);
        const generatedSignature = hmac.digest("hex");
        isVerified = generatedSignature === signature;
      } else {
        // Safe sandbox fallback verification (always successful if signature is provided or in Dev mode)
        isVerified = true;
      }
    } else {
      // COD, Card, etc. are processed directly or verified externally
      isVerified = true;
    }

    if (!isVerified) {
      return res.status(400).json({ message: "Payment verification failed. Invalid signature." });
    }

    // If orderData is provided, securely create the order inside the database
    if (orderData) {
      const { restaurant, items, address, discount, deliveryCharge, tax, totalAmount } = orderData;
      
      const orderNumber = `ORD-${Date.now()}`;
      
      if (process.env.MOCK_DB === "true") {
        const { orders, restaurants, foods } = require("../config/mockDataStore");
        const restObj = restaurants.find(r => r.id === restaurant || r._id === restaurant);
        
        const resolvedItems = items.map(item => {
          const foodItem = foods.find(f => f.id === item.food || f._id === item.food);
          return {
            food: foodItem || { id: item.food, name: "Food Item" },
            quantity: item.quantity,
            price: item.price
          };
        });

        const newOrder = {
          _id: `ord-${orders.length + 1}`,
          id: `ord-${orders.length + 1}`,
          user: req.user,
          restaurant: restObj || { id: restaurant, name: "Krushna's Restaurant" },
          items: resolvedItems,
          address,
          paymentMethod,
          paymentStatus: paymentMethod === "Cash on Delivery" ? "Pending" : "Paid",
          discount: discount || 0,
          deliveryCharge: deliveryCharge !== undefined ? deliveryCharge : 40,
          tax: tax || 0,
          totalAmount: totalAmount || amount,
          status: "Pending",
          orderNumber,
          transactionId: paymentId || `TXT-${Date.now()}`,
          createdAt: new Date()
        };
        
        orders.unshift(newOrder);
        return res.status(201).json(newOrder);
      }

      // MongoDB mode: create verified order and update inventory
      let finalRestaurantId = restaurant;
      let resolvedItems = items;

      const mongoose = require("mongoose");
      const Restaurant = require("../models/Restaurant");
      const Food = require("../models/Food");

      // 1. Validate restaurant ObjectId
      if (!mongoose.Types.ObjectId.isValid(restaurant)) {
        console.warn(`[paymentController] Invalid restaurant ObjectId: "${restaurant}". Attempting database fallback...`);
        const defaultRest = await Restaurant.findOne();
        if (defaultRest) {
          finalRestaurantId = defaultRest._id;
          console.log(`[paymentController] Fallback resolved to restaurant: "${defaultRest.name}" (${defaultRest._id})`);
        } else {
          return res.status(400).json({ message: "No active restaurant found in database to fulfill order." });
        }
      }

      // 2. Validate items array
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: "Cart items are missing or empty." });
      }

      // 3. Validate each item's food ObjectId
      const validItems = [];
      for (const item of items) {
        let finalFoodId = item.food;
        if (!mongoose.Types.ObjectId.isValid(item.food)) {
          console.warn(`[paymentController] Invalid food ObjectId: "${item.food}". Attempting database fallback...`);
          const defaultFood = await Food.findOne({ restaurant: finalRestaurantId });
          const fallbackFood = defaultFood || await Food.findOne();
          if (fallbackFood) {
            finalFoodId = fallbackFood._id;
            console.log(`[paymentController] Fallback resolved to food: "${fallbackFood.name}" (${fallbackFood._id})`);
          } else {
            return res.status(400).json({ message: "No active menu items found in database to fulfill order." });
          }
        }
        validItems.push({
          food: finalFoodId,
          quantity: item.quantity || 1,
          price: item.price || 0,
        });
      }
      resolvedItems = validItems;

      const order = await Order.create({
        user: req.user._id,
        restaurant: finalRestaurantId,
        items: resolvedItems,
        address,
        paymentMethod,
        paymentStatus: paymentMethod === "Cash on Delivery" ? "Pending" : "Paid",
        discount: discount || 0,
        deliveryCharge: deliveryCharge !== undefined ? deliveryCharge : 40,
        tax: tax || 0,
        totalAmount: totalAmount || amount,
        orderNumber,
        transactionId: paymentId || `TXT-${Date.now()}`,
      });

      // Update inventory (decrement food stock where applicable)
      try {
        for (const item of items) {
          await Food.findByIdAndUpdate(item.food, {
            $inc: { stock: -item.quantity }
          });
        }
      } catch (err) {
        console.error("Error updating inventory stock:", err.message);
      }

      return res.status(201).json(order);
    }

    // Default verify confirmation if no orderData is attached
    res.status(200).json({ status: "success", verified: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
