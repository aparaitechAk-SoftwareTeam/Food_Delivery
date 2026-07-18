import { io } from "socket.io-client";
import { API_BASE_URL } from "../config";

let socket;

export const getSocket = () => {
  if (!socket) {
    const socketURL = API_BASE_URL.replace("/api", "");
    console.log(`[SocketIO] Connecting Admin Panel to: ${socketURL}`);
    socket = io(socketURL, {
      // WebSocket-first: skip HTTP long-polling on initial connect.
      // Falls back to polling only if WebSocket is unavailable.
      transports: ["websocket", "polling"],
      autoConnect: true,
      reconnectionDelay: 2000,
      reconnectionAttempts: 5,
    });
  }
  return socket;
};
