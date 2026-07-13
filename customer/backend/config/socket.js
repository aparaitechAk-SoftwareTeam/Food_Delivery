const socketIO = require("socket.io");

let io;

const initSocket = (server) => {
  io = socketIO(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST", "PUT", "DELETE"],
    },
  });

  io.on("connection", (socket) => {
    console.log(`[Socket] Connected: ${socket.id}`);

    // Join room for specific user
    socket.on("join", (userId) => {
      socket.join(userId);
      console.log(`[Socket] User ${userId} joined their personal room.`);
    });

    // Join role rooms
    socket.on("join-role", (role) => {
      socket.join(role); // e.g. "admin", "delivery"
      console.log(`[Socket] Socket ${socket.id} joined role room: ${role}`);
    });

    // Join room for specific order tracking
    socket.on("join-order", (orderId) => {
      socket.join(orderId);
      console.log(`[Socket] Socket ${socket.id} joined order room: ${orderId}`);
    });

    // Handle delivery location updates from rider app
    socket.on("update-location", (data) => {
      // data: { orderId, latitude, longitude, heading, speed, timestamp }
      console.log(`[Socket] Location update for order ${data.orderId}: Lat ${data.latitude}, Lng ${data.longitude}`);
      
      // Broadcast to anyone tracking this order (customer app, admin dashboard tracker)
      io.to(data.orderId).emit("delivery-location", data);
      io.to("admin").emit("delivery-location", data);
    });

    socket.on("disconnect", () => {
      console.log(`[Socket] Disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIo = () => {
  return io;
};

const emitOrderUpdate = async (orderId, eventName) => {
  const Order = require("../models/Order");
  const activeIo = getIo();
  if (!activeIo) return;
  try {
    const populated = await Order.findById(orderId).populate("user restaurant deliveryBoy");
    if (!populated) return;

    // Send the specific event (new-order, order-status-updated, delivery-assigned, etc.)
    activeIo.to(orderId.toString()).emit(eventName, populated);
    
    // Broadcast status updates to role-based rooms (admin / delivery boys)
    activeIo.to("admin").emit(eventName, populated);
    activeIo.to("delivery").emit(eventName, populated);
    
    // Also broadcast order-status-updated to let apps listen to a single status event
    activeIo.to(orderId.toString()).emit("order-status-updated", populated);
    activeIo.to("admin").emit("order-status-updated", populated);
    activeIo.to("delivery").emit("order-status-updated", populated);

    console.log(`[SocketService] Emitted ${eventName} and order-status-updated for order ${orderId}`);
  } catch (err) {
    console.error("[SocketService] emitOrderUpdate error:", err.message);
  }
};

module.exports = { initSocket, getIo, emitOrderUpdate };
