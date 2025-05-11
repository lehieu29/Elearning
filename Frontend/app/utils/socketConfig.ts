"use client";
import socketIO from "socket.io-client";
import { socketDebugger } from './socketDebug';

// Hàm lấy WebSocket URL với logic fallback
export const getSocketEndpoint = () => {
  const envUrl = process.env.NEXT_PUBLIC_SOCKET_SERVER_URI;
  if (envUrl) {
    console.log("Socket URL: Sử dụng từ env", envUrl);
    return envUrl;
  }
  
  console.log("Socket URL: Fallback về localhost:8000");
  return "http://localhost:8000";
};

// Function để xác định environment và secure status
const isProduction = () => {
  const endpoint = getSocketEndpoint();
  return endpoint.startsWith('https://') || endpoint.startsWith('wss://');
};

// Cấu hình tối ưu cho Traefik Ingress + Socket.IO
const defaultOptions = {
  transports: ["websocket"],
  
  // Cho phép upgrade từ polling sang websocket
  upgrade: true,
  rememberUpgrade: true,
  
  // Path của socket.io endpoint
  path: "/socket.io",
  
  // Tự động detect secure mode
  secure: isProduction(),
  
  // Chấp nhận self-signed certificates (development)
  rejectUnauthorized: false,
  
  // Reconnection strategy
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  
  // Timeout settings phù hợp với Traefik
  timeout: 20000,
  
  // CORS credentials
  withCredentials: true
};

// Chỉ tạo một instance duy nhất
const socket = socketIO(getSocketEndpoint(), defaultOptions);

// Sử dụng debugger trong development
if (process.env.NODE_ENV === 'development') {
  socketDebugger(socket);
}

// Export function để lấy socket instance hiện tại
export const getSocket = () => socket;

export default socket;
