"use client";
import socketIO from "socket.io-client";

// Hàm lấy WebSocket URL với logic fallback
export const getSocketEndpoint = () => {
  // Trong môi trường production, sử dụng URL cố định
  /*if (process.env.NODE_ENV === 'production') {
    console.log("Socket URL: Sử dụng production");
    return "api.studynow.space";
  }*/
  
  // Sử dụng biến môi trường nếu có
  const envUrl = process.env.NEXT_PUBLIC_SOCKET_SERVER_URI;
  if (envUrl) {
    console.log("Socket URL: Sử dụng từ env", envUrl);
    return envUrl;
  }
  
  // Fallback về localhost
  console.log("Socket URL: Fallback về localhost:8000");
  return "http://localhost:8000";
};

// Pre-initialize socket với URL đúng
export const socketInstance = socketIO(getSocketEndpoint(), { 
  transports: ["websocket"] 
});

// Exportable factory function để tạo socket mới khi cần
export const createSocket = (options = {}) => {
  return socketIO(getSocketEndpoint(), { 
    transports: ["polling", "websocket"],
    upgrade: true, // Cho phép upgrade lên websocket
    rememberUpgrade: true,
    path: "/socket.io",
    secure: true,
    rejectUnauthorized: false,
    ...options
  });
};

export default socketInstance;
