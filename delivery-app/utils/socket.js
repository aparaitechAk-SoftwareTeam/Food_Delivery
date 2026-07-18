import { io } from "socket.io-client";
import api from "./api";

let socket;

export const getSocket = () => {
  if (!socket) {
    const baseURL = api.defaults.baseURL || "";
    const socketURL = baseURL.replace("/api", "");
    console.log(`[SocketIO] Connecting customer-app to: ${socketURL}`);
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
