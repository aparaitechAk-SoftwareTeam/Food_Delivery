import { io } from "socket.io-client";
import api from "./api";

let socket;

export const getSocket = () => {
  if (!socket) {
    const baseURL = api.defaults.baseURL;
    const socketURL = baseURL.replace("/api", "");
    console.log(`[SocketIO] Connecting delivery-app to: ${socketURL}`);
    socket = io(socketURL, {
      transports: ["websocket"],
      autoConnect: true,
    });
  }
  return socket;
};
