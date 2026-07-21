const User = require("../models/User");
const Order = require("../models/Order");
const Review = require("../models/Review");

// 1. Toggle Online/Offline Status
exports.toggleOnlineStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(450).json({ message: "Rider profile not found" });
    }
    if (req.body.isOnline !== undefined) {
      user.isOnline = !!req.body.isOnline;
    } else {
      user.isOnline = !user.isOnline;
    }
    await user.save();

    res.json({
      message: `Status updated to ${user.isOnline ? "Online" : "Offline"}`,
      isOnline: user.isOnline,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 2. Update Live GPS Location
exports.updateLocation = async (req, res) => {
  const { latitude, longitude, orderId, heading, speed } = req.body;
  if (latitude === undefined || longitude === undefined) {
    return res.status(400).json({ message: "Latitude and Longitude are required" });
  }

  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(450).json({ message: "Rider profile not found" });
    }

    user.location = {
      latitude: Number(latitude),
      longitude: Number(longitude),
      updatedAt: new Date(),
    };
    await user.save();

    // If active order is tracked, save history & emit socket event
    if (orderId) {
      const DeliveryLocation = require("../models/DeliveryLocation");
      const locRecord = await DeliveryLocation.create({
        orderId,
        deliveryBoyId: req.user._id,
        latitude: Number(latitude),
        longitude: Number(longitude),
        heading: heading !== undefined ? Number(heading) : 0,
        speed: speed !== undefined ? Number(speed) : 0,
        timestamp: new Date(),
      });

      const { getIo } = require("../config/socket");
      const io = getIo();
      if (io) {
        const updatePayload = {
          orderId,
          deliveryBoyId: req.user._id,
          latitude: Number(latitude),
          longitude: Number(longitude),
          heading: heading !== undefined ? Number(heading) : 0,
          speed: speed !== undefined ? Number(speed) : 0,
          timestamp: locRecord.timestamp,
        };
        io.to(orderId.toString()).emit("delivery-location", updatePayload);
        io.to("admin").emit("delivery-location", updatePayload);
      }
    }

    res.json({ message: "Rider location updated successfully", location: user.location });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 3. Get Assigned Orders
exports.getAssignedOrders = async (req, res) => {
  try {
    // Find active orders assigned to the delivery boy that are not finished
    const orders = await Order.find({
      deliveryBoy: req.user._id,
      deliveryStatus: { $in: ["Assigned", "Accepted", "Arrived At Restaurant", "Picked Up"] },
    })
      .populate("user", "name phone email")
      .populate("restaurant", "name address coordinates image")
      .populate("items.food", "name image price")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 4. Update Delivery Workflow Status
exports.updateDeliveryStatus = async (req, res) => {
  const { status } = req.body; // Assigned, Accepted, Arrived At Restaurant, Picked Up, Delivered, Cash Collected, Completed, Rejected
  const orderId = req.params.id;

  const validStatuses = ["Assigned", "Accepted", "Arrived At Restaurant", "Picked Up", "Delivered", "Cash Collected", "Completed", "Rejected"];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: "Invalid delivery status value" });
  }

  try {
    const order = await Order.findOne({ _id: orderId, deliveryBoy: req.user._id });
    if (!order) {
      return res.status(450).json({ message: "Assigned order not found" });
    }

    if (["Delivered", "Completed", "Cancelled"].includes(order.status) && status !== "Completed" && status !== "Cash Collected") {
      return res.status(400).json({ message: "Cannot revert a finalized order (Delivered/Completed/Cancelled) to an active state." });
    }

    if (status === "Completed" && order.paymentStatus !== "Paid") {
      return res.status(400).json({ message: "Order cannot be completed until payment is confirmed." });
    }

    if (status === "Cash Collected") {
      order.paymentStatus = "Paid";
      order.paidAt = new Date();
      order.paymentReceivedAt = new Date();
    } else if (status === "Completed") {
      order.status = "Completed";
      order.deliveryStatus = "Completed";
      order.completedAt = new Date();
    } else if (status === "Rejected") {
      order.status = "Confirmed";
      order.deliveryBoy = undefined;
      order.deliveryStatus = "None";
    } else {
      order.deliveryStatus = status;
      if (status === "Accepted") {
        order.status = "Preparing";
      } else if (status === "Picked Up") {
        order.status = "Out For Delivery";
      } else if (status === "Delivered") {
        order.status = "Delivered";
      }
    }

    // Sync payment details if provided during delivery completion
    if (req.body.paymentMethod) {
      order.paymentMethod = req.body.paymentMethod;
    }
    if (req.body.paymentStatus === "Paid" || status === "Cash Collected") {
      order.paymentStatus = "Paid";
      order.paidAt = order.paidAt || new Date();
      order.paymentReceivedAt = order.paymentReceivedAt || new Date();
    }

    // Sync redundant tracking status fields for Feature 9 compatibility
    order.riderStatus = order.deliveryStatus;
    order.orderStatus = order.status;

    await order.save();

    if (status === "Delivered" || order.status === "Delivered") {
      const cashbackService = require("../services/cashbackService");
      await cashbackService.handleOrderDelivered(order);
    }

    const { emitOrderUpdate } = require("../config/socket");
    let eventName = "order-status-updated";
    if (status === "Picked Up") eventName = "delivery-picked";
    else if (status === "Delivered" || status === "Completed") eventName = "delivery-completed";
    await emitOrderUpdate(orderId, eventName);

    const populatedOrder = await Order.findById(orderId).populate("user restaurant deliveryBoy");
    res.json({ message: "Order status synchronized successfully", order: populatedOrder });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 5. Get Rider Earnings & Performance widgets
exports.getRiderEarnings = async (req, res) => {
  try {
    const mongoose = require("mongoose");
    const rId = req.user._id;
    const objectId = mongoose.Types.ObjectId.isValid(rId) ? new mongoose.Types.ObjectId(rId) : rId;

    const orders = await Order.find({ 
      $or: [
        { deliveryBoy: rId },
        { deliveryBoy: objectId }
      ],
      $or: [
        { status: { $in: ["Delivered", "Completed"] } },
        { deliveryStatus: { $in: ["Delivered", "Completed"] } },
        { riderStatus: { $in: ["Delivered", "Completed"] } },
        { orderStatus: { $in: ["Delivered", "Completed"] } }
      ]
    });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);

    const monthStart = new Date();
    monthStart.setDate(monthStart.getDate() - 30);

    let todayEarnings = 0;
    let weeklyEarnings = 0;
    let monthlyEarnings = 0;
    let totalEarnings = 0;
    let cashCollected = 0;
    let onlineEarnings = 0;

    orders.forEach((o) => {
      const orderDate = new Date(o.createdAt);
      const pay = o.deliveryCharge || 40;
      totalEarnings += pay;

      const isCOD = !o.paymentMethod || o.paymentMethod.toLowerCase().includes("cash") || o.paymentMethod.toUpperCase() === "COD";
      if (isCOD) {
        cashCollected += o.totalAmount || 0;
      } else {
        onlineEarnings += o.totalAmount || 0;
      }

      if (orderDate >= todayStart) {
        todayEarnings += pay;
      }
      if (orderDate >= weekStart) {
        weeklyEarnings += pay;
      }
      if (orderDate >= monthStart) {
        monthlyEarnings += pay;
      }
    });

    const reviews = await Review.find({ deliveryBoy: req.user._id, status: "Approved" });
    const avgRating = reviews.length > 0
      ? Number((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1))
      : 4.8;

    res.json({
      todayEarnings,
      weeklyEarnings,
      monthlyEarnings,
      totalEarnings,
      cashCollected,
      onlineEarnings,
      completedCount: orders.length,
      avgRating,
      ratingCount: reviews.length,
      averageDeliveryTime: 25,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 6. Get Rider Delivery History with Money Records
exports.getRiderHistory = async (req, res) => {
  try {
    const mongoose = require("mongoose");
    const rId = req.user._id;
    const objectId = mongoose.Types.ObjectId.isValid(rId) ? new mongoose.Types.ObjectId(rId) : rId;

    const orders = await Order.find({
      $or: [
        { deliveryBoy: rId },
        { deliveryBoy: objectId }
      ]
    })
      .populate("user", "name phone email")
      .populate("restaurant", "name address")
      .populate("items.food", "name image price")
      .sort({ createdAt: -1 });

    let completedCount = 0;
    let totalEarnings = 0;
    let cashCollected = 0;
    let onlineEarnings = 0;

    orders.forEach((o) => {
      const isCompleted = ["Delivered", "Completed"].includes(o.status) || 
                          ["Delivered", "Completed"].includes(o.deliveryStatus) ||
                          ["Delivered", "Completed"].includes(o.riderStatus) ||
                          ["Delivered", "Completed"].includes(o.orderStatus);

      if (isCompleted) {
        completedCount += 1;
        totalEarnings += o.deliveryCharge || 40;
        const isCOD = !o.paymentMethod || o.paymentMethod.toLowerCase().includes("cash") || o.paymentMethod.toUpperCase() === "COD";
        if (isCOD) {
          cashCollected += o.totalAmount || 0;
        } else {
          onlineEarnings += o.totalAmount || 0;
        }
      }
    });

    res.json({
      summary: {
        completedCount,
        totalEarnings,
        cashCollected,
        onlineEarnings,
        totalOrders: orders.length,
      },
      orders,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 7. Get Rider Reviews
exports.getRiderReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ deliveryBoy: req.user._id, status: "Approved" })
      .populate("user", "name")
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
