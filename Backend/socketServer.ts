import { Server as SocketIOServer } from "socket.io";
import http from "http";

// Khai báo biến để export cho các module khác sử dụng
let io: SocketIOServer;

export const initSocketServer = (server: http.Server) => {
  io = new SocketIOServer(server, {
    cors: {
      origin: process.env.ORIGIN?.split(",") || ["http://localhost:3000"],
      credentials: true,
      methods: ["GET", "POST"]
    },
    transports: ["polling", "websocket"],
    allowUpgrades: true, // Đảm bảo cho phép upgrade
    pingTimeout: 60000,
    pingInterval: 25000
  });

  io.on("connection", (socket) => {
    console.log("A user connected");

    // Listen for 'notification' event from the frontend
    socket.on("notification", (data) => {
      // Broadcast the notification data to all connected clients (admin dashboard)
      io.emit("newNotification", data);
    });

    socket.on("disconnect", () => {
      console.log("A user disconnected");
    });
  });

  return io;
};

// Thêm hàm mới để phát sóng cập nhật tiến độ video
export const emitVideoProgress = (processId: string, progress: number, message: string, result?: any) => {
  if (!io) {
    console.error("Socket.IO not initialized");
    return;
  }

  io.emit("videoProgress", {
    processId,
    progress,
    message,
    result,
    timestamp: Date.now(),
  });
};