const Order = require("../models/Order");
const mongoose = require("mongoose");


exports.createOrder = async (req, res) => {
  try {
    const { restaurant, items, address, paymentMethod, discount, deliveryCharge, tax, totalAmount } = req.body;
    
    if (process.env.MOCK_DB === "true") {
      const { orders, restaurants, foods } = require("../config/mockDataStore");
      const orderNumber = `FE${10000 + orders.length + 1}`;
      
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
        restaurant: restObj || { id: restaurant, name: "Restaurant" },
        items: resolvedItems,
        address,
        paymentMethod: paymentMethod || "Cash on Delivery",
        paymentStatus: "Pending",
        discount: discount || 0,
        deliveryCharge: deliveryCharge !== undefined ? deliveryCharge : 40,
        tax: tax || 0,
        totalAmount,
        status: "Pending",
        orderNumber,
        createdAt: new Date()
      };
      
      orders.unshift(newOrder);
      return res.status(201).json(newOrder);
    }

    let finalRestaurantId = restaurant;
    let resolvedItems = items;

    if (process.env.MOCK_DB !== "true") {
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
    }

    const order = await Order.create({
      user: req.user._id,
      restaurant: finalRestaurantId,
      items: resolvedItems,
      address,
      paymentMethod: paymentMethod || "Cash on Delivery",
      paymentStatus: paymentMethod === "Cash on Delivery" ? "Pending" : "Paid",
      discount: discount || 0,
      deliveryCharge: deliveryCharge !== undefined ? deliveryCharge : 40,
      tax: tax || 0,
      totalAmount,
      orderNumber: `ORD-${Date.now()}`,
    });
    
    res.status(201).json(order);
  } catch (error) {
    console.error("Order creation failed error:", error);
    res.status(500).json({ message: "Failed to place order: " + error.message });
  }
};

exports.getOrders = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    
    if (process.env.MOCK_DB === "true") {
      const { orders } = require("../config/mockDataStore");
      const userOrders = orders.filter(
        order => order.user && (order.user._id === userId || order.user.id === userId)
      );
      
      const current = userOrders.filter(
        (order) => order.status !== "Delivered" && order.status !== "Cancelled"
      );
      const history = userOrders.filter(
        (order) => order.status === "Delivered" || order.status === "Cancelled"
      );
      return res.json({ current, history });
    }

    const orders = await Order.find({ user: req.user._id })
      .populate("restaurant")
      .populate("items.food")
      .sort({ createdAt: -1 });
      
    const current = orders.filter(
      (order) => order.status !== "Delivered" && order.status !== "Cancelled"
    );
    const history = orders.filter(
      (order) => order.status === "Delivered" || order.status === "Cancelled"
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

    if (process.env.MOCK_DB === "true") {
      const { orders } = require("../config/mockDataStore");
      const order = orders.find(o => o.id === id || o._id === id);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      if (order.user && order.user._id !== userId && order.user.id !== userId) {
        return res.status(403).json({ message: "Not authorized to view this order" });
      }
      
      return res.json(order);
    }

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

    if (process.env.MOCK_DB === "true") {
      const { orders } = require("../config/mockDataStore");
      const orderIndex = orders.findIndex(o => o.id === id || o._id === id);
      
      if (orderIndex === -1) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      const order = orders[orderIndex];
      if (order.user && order.user._id !== userId && order.user.id !== userId) {
        return res.status(403).json({ message: "Not authorized to cancel this order" });
      }
      
      if (order.status !== "Pending" && order.status !== "Confirmed") {
        return res.status(400).json({ message: "Order cannot be cancelled at this stage" });
      }
      
      order.status = "Cancelled";
      order.cancellationReason = reason || "Cancelled by user";
      orders[orderIndex] = order;
      
      return res.json(order);
    }

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

    if (process.env.MOCK_DB === "true") {
      const { orders } = require("../config/mockDataStore");
      oldOrder = orders.find(o => o.id === id || o._id === id);
      
      if (!oldOrder) {
        return res.status(404).json({ message: "Original order not found" });
      }
      
      if (oldOrder.user && oldOrder.user._id !== userId && oldOrder.user.id !== userId) {
        return res.status(403).json({ message: "Not authorized" });
      }

      // Format items to submit to createOrder
      const items = oldOrder.items.map(item => ({
        food: item.food._id || item.food.id,
        quantity: item.quantity,
        price: item.price
      }));

      req.body = {
        restaurant: oldOrder.restaurant._id || oldOrder.restaurant.id,
        items,
        address: oldOrder.address,
        paymentMethod: oldOrder.paymentMethod,
        discount: oldOrder.discount,
        deliveryCharge: oldOrder.deliveryCharge,
        tax: oldOrder.tax,
        totalAmount: oldOrder.totalAmount
      };
      
      return exports.createOrder(req, res);
    }

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
