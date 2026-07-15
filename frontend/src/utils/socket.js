import { io } from "socket.io-client";
import { API_BASE_URL } from "../config";

let socket;

export const getSocket = () => {
  if (!socket) {
    const socketURL = API_BASE_URL.replace("/api", "");
    console.log(`[SocketIO] Connecting Admin Panel to: ${socketURL}`);
    socket = io(socketURL, {
      transports: ["polling", "websocket"],
      autoConnect: true,
    });
  }
  return socket;
};
