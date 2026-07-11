const Order = require("../models/Order");
const mongoose = require("mongoose");


exports.createOrder = async (req, res) => {
  console.log("[DEBUG BACKEND] createOrder received body:", JSON.stringify(req.body, null, 2));
  console.log("[DEBUG BACKEND] createOrder user:", req.user ? req.user._id : "no user");
  try {
    const { restaurant, items, address, paymentMethod, discount, deliveryCharge, tax, totalAmount } = req.body;
    
    

    let finalRestaurantId = restaurant;
    let resolvedItems = items;

    
      const mongoose = require("mongoose");
      const Restaurant = require("../models/Restaurant");
      const Food = require("../models/Food");

      // 1. Validate restaurant ObjectId
      if (!mongoose.Types.ObjectId.isValid(restaurant)) {
        console.warn(`[orderController] Invalid restaurant ObjectId: "${restaurant}". Attempting database fallback...`);
        const defaultRest = await Restaurant.findOne();
        if (defaultRest) {
          finalRestaurantId = defaultRest._id;
          console.log(`[orderController] Fallback resolved to restaurant: "${defaultRest.name}" (${defaultRest._id})`);
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
          console.warn(`[orderController] Invalid food ObjectId: "${item.food}". Attempting database fallback...`);
          const defaultFood = await Food.findOne({ restaurant: finalRestaurantId });
          const fallbackFood = defaultFood || await Food.findOne();
          if (fallbackFood) {
            finalFoodId = fallbackFood._id;
            console.log(`[orderController] Fallback resolved to food: "${fallbackFood.name}" (${fallbackFood._id})`);
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
    

    // Calculate subtotal from resolvedItems
    const subtotal = resolvedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    let finalDeliveryCharge = deliveryCharge !== undefined ? deliveryCharge : 40;
    let finalDiscount = discount || 0;

    // Check if user is active Gold member
    const User = require("../models/User");
    const dbUser = await User.findById(req.user._id);
    const isGold = dbUser && dbUser.isGoldMember && dbUser.goldExpiry && dbUser.goldExpiry > new Date();

    if (isGold) {
      finalDeliveryCharge = 0;
      const goldDiscount = parseFloat((subtotal * 0.1).toFixed(2));
      finalDiscount = parseFloat((finalDiscount + goldDiscount).toFixed(2));
    }

    const finalTotalAmount = parseFloat((subtotal + (tax || 0) + finalDeliveryCharge - finalDiscount).toFixed(2));

    console.log("[DEBUG BACKEND] Before database save...");
    const order = await Order.create({
      user: req.user._id,
      customerName: req.user.name,
      customerEmail: req.user.email,
      customerPhone: req.user.phone,
      restaurant: finalRestaurantId,
      items: resolvedItems,
      address,
      paymentMethod: paymentMethod || "Cash on Delivery",
      paymentStatus: paymentMethod === "Cash on Delivery" ? "Pending" : "Paid",
      discount: finalDiscount,
      deliveryCharge: finalDeliveryCharge,
      tax: tax || 0,
      totalAmount: finalTotalAmount,
      orderNumber: `ORD-${Date.now()}`,
      otp: Math.floor(1000 + Math.random() * 9000).toString(),
    });
    console.log("[DEBUG BACKEND] After database save success:", order._id);

    const { emitOrderUpdate } = require("../config/socket");
    await emitOrderUpdate(order._id, "new-order");
    
    console.log("[DEBUG BACKEND] Before response dispatch...");
    res.status(201).json(order);
    console.log("[DEBUG BACKEND] After response dispatched.");
  } catch (error) {
    console.error("Order creation failed error:", error);
    res.status(500).json({ message: "Failed to place order: " + error.message });
  }
};

exports.getOrders = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    
    

    const orders = await Order.find({ user: req.user._id })
      .populate("restaurant")
      .populate("items.food")
      .sort({ createdAt: -1 });
      
    const current = orders.filter(
      (order) => order.status !== "Delivered" && order.status !== "Completed" && order.status !== "Cancelled"
    );
    const history = orders.filter(
      (order) => order.status === "Delivered" || order.status === "Completed" || order.status === "Cancelled"
    );
    res.json({ current, history });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getOrderDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id.toString();

    

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid Order ID format" });
    }

    const order = await Order.findById(id)
      .populate("restaurant")
      .populate("items.food");
      
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to view this order" });
    }
    
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user._id.toString();

    

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid Order ID format" });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to cancel this order" });
    }
    
    if (order.status !== "Pending" && order.status !== "Confirmed") {
      return res.status(400).json({ message: "Order cannot be cancelled at this stage" });
    }
    
    order.status = "Cancelled";
    order.cancellationReason = reason || "Cancelled by user";
    await order.save();
    
    const populated = await order.populate("restaurant items.food");
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.reorder = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id.toString();

    let oldOrder = null;

    

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid Order ID format" });
    }

    oldOrder = await Order.findById(id);
    if (!oldOrder) {
      return res.status(404).json({ message: "Original order not found" });
    }
    
    if (oldOrder.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const items = oldOrder.items.map(item => ({
      food: item.food,
      quantity: item.quantity,
      price: item.price
    }));

    req.body = {
      restaurant: oldOrder.restaurant,
      items,
      address: oldOrder.address,
      paymentMethod: oldOrder.paymentMethod,
      discount: oldOrder.discount,
      deliveryCharge: oldOrder.deliveryCharge,
      tax: oldOrder.tax,
      totalAmount: oldOrder.totalAmount
    };

    return exports.createOrder(req, res);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getOrderTracking = async (req, res) => {
  const Order = require("../models/Order");
  const OrderTracking = require("../models/OrderTracking");
  const DeliveryLocation = require("../models/DeliveryLocation");

  try {
    const order = await Order.findById(req.params.id)
      .populate("user", "name email phone profilePhoto")
      .populate("restaurant", "name address latitude longitude")
      .populate("deliveryBoy", "name email phone profilePhoto location");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Security: Customer can only view own orders, Admin can view all, Delivery Boy assigned can view
    if (
      req.user.role === "customer" &&
      order.user?._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: "Not authorized to track this order" });
    }
    if (
      req.user.role === "delivery" &&
      order.deliveryBoy?._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: "Not authorized to track this order" });
    }

    // Find or initialize tracking timeline
    let tracking = await OrderTracking.findOne({ orderId: order._id });
    if (!tracking) {
      const timeline = [];
      timeline.push({ status: "Pending", timestamp: order.createdAt, description: "Order placed successfully" });
      
      if (order.status !== "Pending" && order.status !== "Cancelled") {
        timeline.push({ status: "Confirmed", timestamp: order.updatedAt, description: "Order accepted by restaurant" });
      }
      if (["Preparing", "Ready For Pickup", "Out For Delivery", "Delivered", "Completed"].includes(order.status)) {
        timeline.push({ status: "Preparing", timestamp: order.updatedAt, description: "Kitchen is preparing your meal" });
      }
      if (["Ready For Pickup", "Out For Delivery", "Delivered", "Completed"].includes(order.status)) {
        timeline.push({ status: "Ready For Pickup", timestamp: order.updatedAt, description: "Order is ready for rider pickup" });
      }
      if (["Out For Delivery", "Delivered", "Completed"].includes(order.status)) {
        timeline.push({ status: "Out For Delivery", timestamp: order.updatedAt, description: "Rider is delivering your order" });
      }
      if (["Delivered", "Completed"].includes(order.status)) {
        timeline.push({ status: "Delivered", timestamp: order.updatedAt, description: "Order delivered successfully" });
      }

      tracking = await OrderTracking.create({
        orderId: order._id,
        status: order.status,
        timeline,
        eta: "25-35 mins",
      });
    } else {
      // Sync tracking status with order status if it changed
      if (tracking.status !== order.status) {
        tracking.status = order.status;
        // Add step to timeline if not already there
        const exists = tracking.timeline.some((t) => t.status === order.status);
        if (!exists) {
          let desc = `Order updated to ${order.status}`;
          if (order.status === "Confirmed") desc = "Order accepted by restaurant";
          else if (order.status === "Preparing") desc = "Kitchen is preparing your meal";
          else if (order.status === "Ready For Pickup") desc = "Order is ready for rider pickup";
          else if (order.status === "Out For Delivery") desc = "Rider is delivering your order";
          else if (order.status === "Delivered") desc = "Order delivered successfully";
          else if (order.status === "Cancelled") desc = "Order was cancelled";
          
          tracking.timeline.push({ status: order.status, timestamp: new Date(), description: desc });
        }
        await tracking.save();
      }
    }

    // Get live rider location if assigned
    let currentLocation = null;
    if (order.deliveryBoy) {
      const latestLoc = await DeliveryLocation.findOne({ deliveryBoyId: order.deliveryBoy._id }).sort({ timestamp: -1 });
      if (latestLoc) {
        currentLocation = {
          latitude: latestLoc.latitude,
          longitude: latestLoc.longitude,
          heading: latestLoc.heading,
          speed: latestLoc.speed,
          timestamp: latestLoc.timestamp,
        };
      } else if (order.deliveryBoy.location && order.deliveryBoy.location.latitude) {
        currentLocation = {
          latitude: order.deliveryBoy.location.latitude,
          longitude: order.deliveryBoy.location.longitude,
          heading: 0,
          speed: 0,
          timestamp: order.deliveryBoy.location.updatedAt || new Date(),
        };
      }
    }

    res.json({
      status: order.status,
      timeline: tracking.timeline,
      deliveryBoy: order.deliveryBoy,
      eta: tracking.eta,
      currentLocation,
      restaurant: order.restaurant,
      customer: {
        name: order.customerName || order.user?.name,
        phone: order.customerPhone || order.user?.phone,
        address: order.address,
      },
      orderDetails: {
        id: order._id,
        orderNumber: order.orderNumber,
        items: order.items,
        subtotal: order.subtotal || order.totalAmount - (order.deliveryCharge || 0) - (order.tax || 0) + (order.discount || 0),
        discount: order.discount,
        deliveryCharge: order.deliveryCharge,
        tax: order.tax,
        totalAmount: order.totalAmount,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        createdAt: order.createdAt,
        otp: order.otp,
      },
      mapCoordinates: {
        restaurant: {
          latitude: order.restaurant?.latitude || 18.1560,
          longitude: order.restaurant?.longitude || 74.5775,
        },
        customer: {
          latitude: order.latitude || order.address?.latitude || 18.1510,
          longitude: order.longitude || order.address?.longitude || 74.5780,
        },
        deliveryBoy: currentLocation,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to load tracking info: " + error.message });
  }
};
