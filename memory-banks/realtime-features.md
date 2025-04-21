# Tính Năng Realtime Trong Dự Án E-Learning

Dự án E-Learning tích hợp tính năng realtime thông qua Socket.IO để cung cấp trải nghiệm tương tác, cập nhật dữ liệu ngay lập tức và thông báo thời gian thực cho người dùng. Tài liệu này mô tả chi tiết về các tính năng realtime và cách chúng được triển khai trong dự án.

## 1. Tổng Quan Về Tính Năng Realtime

### 1.1. Công Nghệ Sử Dụng

- **Socket.IO**: Thư viện WebSocket chính được sử dụng để kết nối realtime
- **Redis**: Adapter cho Socket.IO để hỗ trợ scaling nhiều node
- **MongoDB Change Streams**: Lắng nghe thay đổi dữ liệu từ MongoDB

### 1.2. Các Tính Năng Realtime Chính

1. **Thông Báo Realtime**:
   - Thông báo về các sự kiện hệ thống
   - Thông báo khi có người mua khóa học
   - Thông báo bình luận và trả lời

2. **Chat Trực Tiếp**:
   - Chat với giảng viên
   - Hỗ trợ trực tiếp từ admin

3. **Cập Nhật Trạng Thái**:
   - Hiển thị trạng thái online của người dùng
   - Hiển thị trạng thái xem video của học viên

4. **Cập Nhật Dữ Liệu Realtime**:
   - Hiển thị số lượng người đang xem khóa học
   - Cập nhật điểm đánh giá và bình luận mới

## 2. Kiến Trúc Socket.IO

### 2.1. Cấu Hình Socket Server

```typescript
// Backend/socketServer.ts
import { Server as SocketIOServer } from "socket.io";
import http from "http";
import Redis from "ioredis";
import { createAdapter } from "@socket.io/redis-adapter";

// Khởi tạo Redis clients
const pubClient = new Redis(process.env.REDIS_URL || "redis://localhost:6379");
const subClient = pubClient.duplicate();

// Khởi tạo Socket.IO server
export const initSocketServer = (server: http.Server) => {
  const io = new SocketIOServer(server, {
    cors: {
      origin: process.env.ORIGIN?.split(",") || ["http://localhost:3000"],
      credentials: true,
    },
    adapter: createAdapter(pubClient, subClient),
    transports: ["websocket", "polling"],
  });

  // Xác thực người dùng khi kết nối
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error("Authentication error"));
      }
      
      // Xác thực token
      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN as string);
      socket.data.user = decoded;
      
      next();
    } catch (error) {
      next(new Error("Authentication error"));
    }
  });

  // Xử lý kết nối
  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Tham gia room cá nhân dựa trên user ID
    if (socket.data.user?.id) {
      socket.join(`user:${socket.data.user.id}`);
    }

    // Xử lý thông báo
    socket.on("notification", (data) => {
      // Lưu thông báo vào DB
      saveNotificationToDB(data);
      
      // Gửi thông báo đến admin hoặc người dùng cụ thể
      if (data.userId) {
        io.to(`user:${data.userId}`).emit("newNotification", data);
      }
      
      // Gửi thông báo đến admin nếu cần
      if (data.toAdmin) {
        io.to("admin").emit("newNotification", data);
      }
    });

    // Xử lý chat
    socket.on("message", (data) => {
      saveMessageToDB(data);
      
      // Gửi tin nhắn đến người nhận
      if (data.recipientId) {
        io.to(`user:${data.recipientId}`).emit("newMessage", data);
      }
    });

    // Xử lý trạng thái online
    socket.on("userStatus", (status) => {
      // Cập nhật trạng thái người dùng
      if (socket.data.user?.id) {
        io.emit("userStatusUpdate", {
          userId: socket.data.user.id,
          status,
        });
      }
    });

    // Xử lý xem video
    socket.on("watchingVideo", (data) => {
      // Tham gia room của video đang xem
      socket.join(`video:${data.videoId}`);
      
      // Đếm số người đang xem
      const clientsCount = io.sockets.adapter.rooms.get(`video:${data.videoId}`)?.size || 0;
      
      // Thông báo cho tất cả người dùng đang xem cùng video
      io.to(`video:${data.videoId}`).emit("viewerCount", { count: clientsCount });
    });

    // Xử lý khi ngắt kết nối
    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.id}`);
      
      // Xử lý các hành động khi người dùng ngắt kết nối
      // ...
    });
  });

  // Tạo room cho admin
  const adminNamespace = io.of("/admin");
  adminNamespace.use((socket, next) => {
    // Kiểm tra quyền admin
    const token = socket.handshake.auth.token;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN as string);
        if (decoded.role === "admin") {
          socket.data.admin = decoded;
          return next();
        }
      } catch (error) {
        // Xử lý lỗi
      }
    }
    next(new Error("Admin authentication failed"));
  });

  // Xử lý kết nối từ admin
  adminNamespace.on("connection", (socket) => {
    console.log(`Admin connected: ${socket.id}`);
    socket.join("admin");
    
    // Xử lý các sự kiện dành riêng cho admin
    // ...
  });

  return io;
};

// Hàm lưu thông báo vào database
const saveNotificationToDB = async (data: any) => {
  try {
    await NotificationModel.create({
      title: data.title,
      message: data.message,
      status: "unread",
      userId: data.userId,
    });
  } catch (error) {
    console.error("Error saving notification:", error);
  }
};

// Hàm lưu tin nhắn chat vào database
const saveMessageToDB = async (data: any) => {
  try {
    await MessageModel.create({
      sender: data.senderId,
      recipient: data.recipientId,
      content: data.content,
      status: "sent",
    });
  } catch (error) {
    console.error("Error saving message:", error);
  }
};
```

### 2.2. Kết Nối Socket.IO với Server Express

```typescript
// Backend/server.ts
import http from "http";
import app from "./app";
import { initSocketServer } from "./socketServer";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

// Database connection
mongoose.connect(process.env.DB_URL || "", {
  // options
})
.then(() => console.log("MongoDB connected"))
.catch((err) => console.log(err));

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = initSocketServer(server);

// Handle errors
server.on("error", (error) => {
  console.error("Server error:", error);
});

// Start server
const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

## 3. Tích Hợp Realtime Trên Frontend

### 3.1. Context Provider cho Socket.IO

```tsx
// Frontend/app/utils/SocketContext.tsx
"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useSelector } from "react-redux";

interface SocketContextProps {
  socket: Socket | null;
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
}

const SocketContext = createContext<SocketContextProps>({
  socket: null,
  isConnected: false,
  connect: () => {},
  disconnect: () => {},
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  // Lấy token từ Redux store
  const { token, user } = useSelector((state: any) => state.auth);
  
  // Kết nối socket
  const connect = () => {
    // Kiểm tra nếu đã kết nối
    if (socket && socket.connected) return;
    
    // Tạo kết nối mới
    const socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_SERVER_URI || "", {
      transports: ["websocket"],
      auth: { token },
      autoConnect: false,
    });
    
    // Set up event listeners
    socketInstance.on("connect", () => {
      console.log("Socket connected");
      setIsConnected(true);
    });
    
    socketInstance.on("disconnect", () => {
      console.log("Socket disconnected");
      setIsConnected(false);
    });
    
    socketInstance.on("connect_error", (err) => {
      console.error("Socket connection error:", err.message);
      setIsConnected(false);
    });
    
    // Kết nối socket
    socketInstance.connect();
    
    // Lưu socket instance
    setSocket(socketInstance);
  };
  
  // Ngắt kết nối socket
  const disconnect = () => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
      setIsConnected(false);
    }
  };
  
  // Tự động kết nối khi có token
  useEffect(() => {
    if (token && user) {
      connect();
    } else {
      disconnect();
    }
    
    // Cleanup khi unmount
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [token, user]);
  
  return (
    <SocketContext.Provider value={{ socket, isConnected, connect, disconnect }}>
      {children}
    </SocketContext.Provider>
  );
};
```

### 3.2. Hook Sử Dụng Thông Báo Realtime

```tsx
// Frontend/app/hooks/useNotifications.ts
"use client";
import { useState, useEffect } from "react";
import { useSocket } from "../utils/SocketContext";
import { useDispatch } from "react-redux";
import { addNotification } from "@/redux/features/notifications/notificationsSlice";
import { toast } from "react-hot-toast";

interface Notification {
  _id: string;
  title: string;
  message: string;
  status: "read" | "unread";
  userId: string;
  createdAt: string;
}

export const useNotifications = () => {
  const { socket, isConnected } = useSocket();
  const dispatch = useDispatch();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // Lắng nghe sự kiện thông báo mới
  useEffect(() => {
    if (!socket || !isConnected) return;
    
    // Handler khi nhận thông báo mới
    const handleNewNotification = (notification: Notification) => {
      // Cập nhật state
      setNotifications((prev) => [notification, ...prev]);
      
      // Thêm vào Redux store
      dispatch(addNotification(notification));
      
      // Hiển thị toast thông báo
      toast(notification.title, {
        description: notification.message,
        style: {
          borderRadius: "10px",
          background: "#333",
          color: "#fff",
        },
      });
    };
    
    // Đăng ký lắng nghe sự kiện
    socket.on("newNotification", handleNewNotification);
    
    // Cleanup
    return () => {
      socket.off("newNotification", handleNewNotification);
    };
  }, [socket, isConnected, dispatch]);
  
  // Gửi thông báo tới người dùng hoặc admin
  const sendNotification = (data: {
    title: string;
    message: string;
    userId?: string;
    toAdmin?: boolean;
  }) => {
    if (!socket || !isConnected) return;
    
    socket.emit("notification", data);
  };
  
  return {
    notifications,
    sendNotification,
  };
};
```

### 3.3. Hook Sử Dụng Chat Realtime

```tsx
// Frontend/app/hooks/useChat.ts
"use client";
import { useState, useEffect } from "react";
import { useSocket } from "../utils/SocketContext";
import { useSelector } from "react-redux";

interface Message {
  _id: string;
  content: string;
  sender: string;
  recipient: string;
  status: "sent" | "delivered" | "read";
  createdAt: string;
}

export const useChat = (recipientId: string) => {
  const { socket, isConnected } = useSocket();
  const { user } = useSelector((state: any) => state.auth);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Lấy lịch sử tin nhắn
  useEffect(() => {
    if (!recipientId || !user?._id) return;
    
    setLoading(true);
    
    // Gọi API để lấy lịch sử chat
    fetch(`${process.env.NEXT_PUBLIC_SERVER_URI}/message/history/${recipientId}`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setMessages(data.messages);
        } else {
          setError(data.message);
        }
      })
      .catch((err) => {
        setError("Failed to load chat history");
        console.error(err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [recipientId, user?._id]);
  
  // Lắng nghe tin nhắn mới
  useEffect(() => {
    if (!socket || !isConnected || !user?._id) return;
    
    // Handler khi nhận tin nhắn mới
    const handleNewMessage = (message: Message) => {
      // Chỉ hiển thị tin nhắn liên quan đến cuộc trò chuyện hiện tại
      if (
        (message.sender === recipientId && message.recipient === user._id) ||
        (message.sender === user._id && message.recipient === recipientId)
      ) {
        setMessages((prev) => [...prev, message]);
        
        // Đánh dấu là đã đọc nếu người dùng hiện tại là người nhận
        if (message.recipient === user._id) {
          socket.emit("markAsRead", { messageId: message._id });
        }
      }
    };
    
    // Đăng ký lắng nghe sự kiện
    socket.on("newMessage", handleNewMessage);
    
    // Cleanup
    return () => {
      socket.off("newMessage", handleNewMessage);
    };
  }, [socket, isConnected, recipientId, user?._id]);
  
  // Gửi tin nhắn mới
  const sendMessage = (content: string) => {
    if (!socket || !isConnected || !user?._id || !recipientId) return;
    
    const messageData = {
      content,
      senderId: user._id,
      recipientId,
    };
    
    // Gửi tin nhắn qua socket
    socket.emit("message", messageData);
    
    // Cập nhật UI ngay lập tức (optimistic update)
    const tempMessage: Message = {
      _id: Date.now().toString(), // Temporary ID
      content,
      sender: user._id,
      recipient: recipientId,
      status: "sent",
      createdAt: new Date().toISOString(),
    };
    
    setMessages((prev) => [...prev, tempMessage]);
  };
  
  return {
    messages,
    loading,
    error,
    sendMessage,
  };
};
```

### 3.4. Hook Sử Dụng Trạng Thái Online

```tsx
// Frontend/app/hooks/useOnlineStatus.ts
"use client";
import { useState, useEffect } from "react";
import { useSocket } from "../utils/SocketContext";

export const useOnlineStatus = (userIds: string[]) => {
  const { socket, isConnected } = useSocket();
  const [onlineUsers, setOnlineUsers] = useState<Record<string, boolean>>({});
  
  // Lắng nghe cập nhật trạng thái người dùng
  useEffect(() => {
    if (!socket || !isConnected || !userIds.length) return;
    
    // Request status for specific users
    socket.emit("getUsersStatus", userIds);
    
    // Listen for status updates
    const handleStatusUpdate = (data: { userId: string; status: boolean }) => {
      if (userIds.includes(data.userId)) {
        setOnlineUsers((prev) => ({
          ...prev,
          [data.userId]: data.status,
        }));
      }
    };
    
    socket.on("userStatusUpdate", handleStatusUpdate);
    
    // Clean up
    return () => {
      socket.off("userStatusUpdate", handleStatusUpdate);
    };
  }, [socket, isConnected, userIds]);
  
  // Set own status
  useEffect(() => {
    if (!socket || !isConnected) return;
    
    // Set online status
    socket.emit("userStatus", true);
    
    // Set up page visibility and focus event handlers
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        socket.emit("userStatus", true);
      } else {
        socket.emit("userStatus", false);
      }
    };
    
    const handleFocus = () => socket.emit("userStatus", true);
    const handleBlur = () => socket.emit("userStatus", false);
    
    // Add event listeners
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);
    
    // Before unload (page close)
    window.addEventListener("beforeunload", () => {
      socket.emit("userStatus", false);
    });
    
    // Clean up
    return () => {
      socket.emit("userStatus", false);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);
    };
  }, [socket, isConnected]);
  
  // Check if a specific user is online
  const isUserOnline = (userId: string) => {
    return !!onlineUsers[userId];
  };
  
  return {
    onlineUsers,
    isUserOnline,
  };
};
```

## 4. Component Realtime

### 4.1. Notification Component

```tsx
// Frontend/app/components/Notification/NotificationCenter.tsx
"use client";
import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { 
  useGetUserNotificationsQuery,
  useUpdateNotificationMutation,
} from "@/redux/features/notifications/notificationsApi";
import { useNotifications } from "@/app/hooks/useNotifications";
import { IoMdNotifications } from "react-icons/io";
import { motion, AnimatePresence } from "framer-motion";
import Loader from "../Loader/Loader";
import { styles } from "@/app/styles/style";

interface Notification {
  _id: string;
  title: string;
  message: string;
  status: "read" | "unread";
  createdAt: string;
}

const NotificationCenter: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dispatch = useDispatch();
  
  // Fetch notifications from API
  const { data, isLoading, refetch } = useGetUserNotificationsQuery(undefined, {
    pollingInterval: 60000, // Poll every minute for new notifications
  });
  
  // Get realtime notifications
  const { notifications } = useNotifications();
  
  // Update notification mutation
  const [updateNotification] = useUpdateNotificationMutation();
  
  // Count unread notifications
  useEffect(() => {
    if (data && data.notifications) {
      const count = data.notifications.filter(
        (notification: Notification) => notification.status === "unread"
      ).length;
      setUnreadCount(count);
    }
  }, [data]);
  
  // Mark notification as read
  const handleNotificationClick = async (id: string) => {
    try {
      await updateNotification(id).unwrap();
      refetch();
    } catch (error) {
      console.error("Failed to mark notification as read", error);
    }
  };
  
  // Toggle notification panel
  const toggleNotifications = () => {
    setIsOpen(!isOpen);
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  return (
    <div className="relative">
      {/* Notification Icon */}
      <button
        onClick={toggleNotifications}
        className="relative p-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full focus:outline-none"
      >
        <IoMdNotifications size={24} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>
      
      {/* Notification Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg z-50 overflow-hidden"
          >
            <div className="p-4 border-b dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                Notifications
              </h3>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {isLoading ? (
                <div className="p-4 flex justify-center">
                  <Loader />
                </div>
              ) : data?.notifications?.length > 0 ? (
                <div>
                  {data.notifications.map((notification: Notification) => (
                    <div
                      key={notification._id}
                      onClick={() => handleNotificationClick(notification._id)}
                      className={`p-4 border-b dark:border-gray-700 cursor-pointer ${
                        notification.status === "unread"
                          ? "bg-blue-50 dark:bg-blue-900/20"
                          : ""
                      }`}
                    >
                      <h4 className="font-medium text-gray-800 dark:text-white">
                        {notification.title}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {formatDate(notification.createdAt)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  No notifications
                </div>
              )}
            </div>
            
            <div className="p-3 text-center border-t dark:border-gray-700">
              <button
                onClick={() => setIsOpen(false)}
                className={`${styles.button} !bg-blue-600 hover:!bg-blue-700 !text-white w-full !h-[30px] !rounded-md`}
              >
                Close
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationCenter;
```

### 4.2. Chat Component

```tsx
// Frontend/app/components/Chat/ChatRoom.tsx
"use client";
import React, { useState, useRef, useEffect } from "react";
import { useChat } from "@/app/hooks/useChat";
import { useOnlineStatus } from "@/app/hooks/useOnlineStatus";
import { useSelector } from "react-redux";
import { BiSend } from "react-icons/bi";
import { BsDot } from "react-icons/bs";
import { IoMdClose } from "react-icons/io";
import { motion } from "framer-motion";
import { styles } from "@/app/styles/style";

interface ChatRoomProps {
  recipientId: string;
  recipientName: string;
  onClose: () => void;
  minimized?: boolean;
  onMinimize?: () => void;
}

const ChatRoom: React.FC<ChatRoomProps> = ({
  recipientId,
  recipientName,
  onClose,
  minimized = false,
  onMinimize,
}) => {
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useSelector((state: any) => state.auth);
  
  // Get chat messages
  const { messages, loading, error, sendMessage } = useChat(recipientId);
  
  // Check if recipient is online
  const { isUserOnline } = useOnlineStatus([recipientId]);
  const isOnline = isUserOnline(recipientId);
  
  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current && !minimized) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, minimized]);
  
  // Handle sending message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      sendMessage(message);
      setMessage("");
    }
  };
  
  // Render minimized chat
  if (minimized) {
    return (
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed bottom-4 right-4 bg-blue-600 text-white rounded-full p-3 shadow-lg cursor-pointer z-40"
        onClick={onMinimize}
      >
        <div className="flex items-center">
          <span className="font-medium">{recipientName}</span>
          {isOnline && (
            <BsDot size={24} className="text-green-400" />
          )}
        </div>
      </motion.div>
    );
  }
  
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed bottom-4 right-4 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg z-40 flex flex-col overflow-hidden"
      style={{ height: "400px" }}
    >
      {/* Chat Header */}
      <div className="bg-blue-600 text-white p-3 flex justify-between items-center">
        <div className="flex items-center">
          <span className="font-medium">{recipientName}</span>
          {isOnline && (
            <BsDot size={24} className="text-green-400" />
          )}
        </div>
        <div className="flex gap-2">
          {onMinimize && (
            <button
              onClick={onMinimize}
              className="text-white hover:text-gray-200"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </button>
          )}
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200"
          >
            <IoMdClose size={16} />
          </button>
        </div>
      </div>
      
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-3 bg-gray-50 dark:bg-gray-900">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <span className="text-gray-500 dark:text-gray-400">Loading...</span>
          </div>
        ) : error ? (
          <div className="flex justify-center items-center h-full">
            <span className="text-red-500">{error}</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex justify-center items-center h-full">
            <span className="text-gray-500 dark:text-gray-400">
              No messages yet. Start a conversation!
            </span>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => (
              <div
                key={msg._id}
                className={`flex ${
                  msg.sender === user._id ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[70%] rounded-lg p-3 ${
                    msg.sender === user._id
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white"
                  }`}
                >
                  <p>{msg.content}</p>
                  <p className="text-xs mt-1 opacity-70">
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      
      {/* Chat Input */}
      <form onSubmit={handleSendMessage} className="p-3 bg-white dark:bg-gray-800 border-t dark:border-gray-700">
        <div className="flex">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 border dark:border-gray-600 rounded-l-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:bg-gray-700 dark:text-white"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-3 py-2 rounded-r-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
            disabled={!message.trim()}
          >
            <BiSend size={20} />
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default ChatRoom;
```

### 4.3. Online Status Indicator

```tsx
// Frontend/app/components/User/OnlineStatus.tsx
"use client";
import React from "react";
import { useOnlineStatus } from "@/app/hooks/useOnlineStatus";
import { BsDot } from "react-icons/bs";

interface OnlineStatusProps {
  userId: string;
  showLabel?: boolean;
  labelPosition?: "left" | "right";
  size?: "sm" | "md" | "lg";
}

const OnlineStatus: React.FC<OnlineStatusProps> = ({
  userId,
  showLabel = false,
  labelPosition = "right",
  size = "md",
}) => {
  const { isUserOnline } = useOnlineStatus([userId]);
  const isOnline = isUserOnline(userId);
  
  // Size configuration
  const dotSizes = {
    sm: 12,
    md: 16,
    lg: 24,
  };
  
  // Label text
  const statusText = isOnline ? "Online" : "Offline";
  
  // If no label, just show the dot
  if (!showLabel) {
    return (
      <span className={`inline-block ${isOnline ? "text-green-500" : "text-gray-400"}`}>
        <BsDot size={dotSizes[size]} />
      </span>
    );
  }
  
  // With label
  return (
    <div className="flex items-center">
      {labelPosition === "left" && (
        <span className="text-sm text-gray-600 dark:text-gray-300 mr-1">
          {statusText}
        </span>
      )}
      
      <span className={`inline-block ${isOnline ? "text-green-500" : "text-gray-400"}`}>
        <BsDot size={dotSizes[size]} />
      </span>
      
      {labelPosition === "right" && (
        <span className="text-sm text-gray-600 dark:text-gray-300 ml-1">
          {statusText}
        </span>
      )}
    </div>
  );
};

export default OnlineStatus;
```

### 4.4. Active Viewers Count

```tsx
// Frontend/app/components/Course/ActiveViewers.tsx
"use client";
import React, { useEffect, useState } from "react";
import { useSocket } from "@/app/utils/SocketContext";
import { FaEye } from "react-icons/fa";

interface ActiveViewersProps {
  videoId: string;
}

const ActiveViewers: React.FC<ActiveViewersProps> = ({ videoId }) => {
  const { socket, isConnected } = useSocket();
  const [viewerCount, setViewerCount] = useState(0);
  
  useEffect(() => {
    if (!socket || !isConnected || !videoId) return;
    
    // Emit watching event when component mounts
    socket.emit("watchingVideo", { videoId });
    
    // Listen for viewer count updates
    const handleViewerCount = (data: { count: number }) => {
      setViewerCount(data.count);
    };
    
    socket.on("viewerCount", handleViewerCount);
    
    // Cleanup
    return () => {
      socket.off("viewerCount", handleViewerCount);
      socket.emit("leaveVideo", { videoId });
    };
  }, [socket, isConnected, videoId]);
  
  return (
    <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
      <FaEye className="mr-1" />
      <span>{viewerCount} watching now</span>
    </div>
  );
};

export default ActiveViewers;
```

## 5. Tổng Hợp Realtime Redux

### 5.1. Notification Slice

```typescript
// Frontend/redux/features/notifications/notificationsSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface Notification {
  _id: string;
  title: string;
  message: string;
  status: "read" | "unread";
  userId: string;
  createdAt: string;
}

interface NotificationsState {
  notifications: Notification[];
  newNotificationsCount: number;
}

const initialState: NotificationsState = {
  notifications: [],
  newNotificationsCount: 0,
};

const notificationsSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    setNotifications: (state, action: PayloadAction<Notification[]>) => {
      state.notifications = action.payload;
      state.newNotificationsCount = action.payload.filter(
        (notification) => notification.status === "unread"
      ).length;
    },
    addNotification: (state, action: PayloadAction<Notification>) => {
      // Add at the beginning of the array (newest first)
      state.notifications = [action.payload, ...state.notifications];
      
      // Increment unread count if the notification is unread
      if (action.payload.status === "unread") {
        state.newNotificationsCount += 1;
      }
    },
    markNotificationAsRead: (state, action: PayloadAction<string>) => {
      const index = state.notifications.findIndex(
        (notification) => notification._id === action.payload
      );
      
      if (index !== -1) {
        // Update notification status
        state.notifications[index].status = "read";
        
        // Decrement unread count
        if (state.newNotificationsCount > 0) {
          state.newNotificationsCount -= 1;
        }
      }
    },
    clearNotifications: (state) => {
      state.notifications = [];
      state.newNotificationsCount = 0;
    },
  },
});

export const {
  setNotifications,
  addNotification,
  markNotificationAsRead,
  clearNotifications,
} = notificationsSlice.actions;

export default notificationsSlice.reducer;
```

### 5.2. Notification API

```typescript
// Frontend/redux/features/notifications/notificationsApi.ts
import { apiSlice } from "../api/apiSlice";
import { setNotifications, markNotificationAsRead } from "./notificationsSlice";

export const notificationsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAllNotifications: builder.query({
      query: () => ({
        url: "get-all-notifications",
        method: "GET",
        credentials: "include" as const,
      }),
    }),
    getUserNotifications: builder.query({
      query: () => ({
        url: "get-user-notifications",
        method: "GET",
        credentials: "include" as const,
      }),
      async onQueryStarted(arg, { queryFulfilled, dispatch }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(setNotifications(data.notifications));
        } catch (error) {
          console.error("Error fetching notifications:", error);
        }
      },
      providesTags: ["Notifications"],
    }),
    updateNotification: builder.mutation({
      query: (id) => ({
        url: `update-notification/${id}`,
        method: "PUT",
        credentials: "include" as const,
      }),
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(markNotificationAsRead(id));
        } catch (error) {
          console.error("Error updating notification:", error);
        }
      },
      invalidatesTags: ["Notifications"],
    }),
  }),
});

export const {
  useGetAllNotificationsQuery,
  useGetUserNotificationsQuery,
  useUpdateNotificationMutation,
} = notificationsApi;
```

## 6. Tích Hợp Socket.IO Với App Layout

```tsx
// Frontend/app/layout.tsx
import { SocketProvider } from "./utils/SocketContext";
import { Providers } from "./Provider";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <SocketProvider>
            {children}
          </SocketProvider>
        </Providers>
      </body>
    </html>
  );
}
```

## 7. Tối Ưu Hóa Hiệu Suất Socket.IO

### 7.1. Server-Side Optimizations

```typescript
// Backend/socketServer.ts
// Thêm cấu hình tối ưu
import { Server as SocketIOServer, ServerOptions } from "socket.io";

// Socket.IO options
const socketOptions: Partial<ServerOptions> = {
  cors: {
    origin: process.env.ORIGIN?.split(",") || ["http://localhost:3000"],
    credentials: true,
  },
  adapter: createAdapter(pubClient, subClient),
  transports: ["websocket", "polling"],
  pingTimeout: 60000, // 60 seconds
  pingInterval: 25000, // 25 seconds
  connectTimeout: 10000, // 10 seconds
  maxHttpBufferSize: 1e6, // 1MB
};

// Cấu hình Redis adapter để scale
const io = new SocketIOServer(server, socketOptions);

// Xử lý nhiều kết nối
io.on("connection", (socket) => {
  // Set socket timeout
  socket.conn.setTimeout(60000);
  
  // Lưu thông tin socket vào Redis để chia sẻ giữa các node (khi scale horizontally)
  if (socket.data.user?.id) {
    redisClient.set(`user:${socket.data.user.id}:socket`, socket.id, "EX", 3600);
  }
  
  // Batch message sending
  socket.use(([event, ...args], next) => {
    if (event === "batchMessages") {
      // Process batch of messages
      const messages = args[0];
      messages.forEach((message: any) => {
        socket.emit(message.event, message.data);
      });
      return;
    }
    next();
  });
  
  // Giám sát và log các sự kiện quan trọng
  socket.on("error", (error) => {
    console.error(`Socket error (${socket.id}):`, error);
  });
  
  socket.conn.on("packet", (packet) => {
    if (packet.type === "error") {
      console.error(`Socket packet error (${socket.id}):`, packet.data);
    }
  });
});
```

### 7.2. Client-Side Optimizations

```typescript
// Frontend/app/utils/SocketConfig.ts
import { ManagerOptions, SocketOptions } from "socket.io-client";

// Cấu hình tối ưu cho Socket.IO client
export const socketConfig: Partial<ManagerOptions & SocketOptions> = {
  transports: ["websocket"],
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 10000,
  forceNew: true,
};

// Sử dụng cấu hình trong SocketContext
// Frontend/app/utils/SocketContext.tsx
import { socketConfig } from "./SocketConfig";

// Trong SocketProvider
const connect = () => {
  if (socket && socket.connected) return;
  
  const socketInstance = io(
    process.env.NEXT_PUBLIC_SOCKET_SERVER_URI || "",
    {
      ...socketConfig,
      auth: { token },
    }
  );
  
  // Setup events...
  
  setSocket(socketInstance);
};
```

## 8. Testing Socket.IO

### 8.1. Unit Testing Socket Handlers

```typescript
// Backend/tests/unit/socket.test.ts
import { createServer } from "http";
import { Server } from "socket.io";
import Client from "socket.io-client";
import { initSocketServer } from "../../socketServer";
import jwt from "jsonwebtoken";

describe("Socket Server", () => {
  let io: Server;
  let serverSocket: any;
  let clientSocket: any;
  let httpServer: any;
  
  beforeAll((done) => {
    // Create HTTP server
    httpServer = createServer();
    
    // Initialize Socket.IO server
    io = initSocketServer(httpServer);
    
    // Start server
    httpServer.listen(() => {
      const port = (httpServer.address() as any).port;
      
      // Create fake token for testing
      const testToken = jwt.sign(
        { id: "test-user-id", role: "user" },
        "test-secret"
      );
      
      // Connect client
      clientSocket = Client(`http://localhost:${port}`, {
        auth: { token: testToken },
        transports: ["websocket"],
      });
      
      clientSocket.on("connect", () => {
        // Get the server socket
        const sockets = Array.from(io.sockets.sockets.values());
        serverSocket = sockets[0];
        done();
      });
    });
  });
  
  afterAll(() => {
    io.close();
    clientSocket.close();
    httpServer.close();
  });
  
  test("should work with client-server communication", (done) => {
    // Setup event handler on server
    serverSocket.on("hello", (arg) => {
      expect(arg).toBe("world");
      serverSocket.emit("hello", "server");
    });
    
    // Setup event handler on client
    clientSocket.on("hello", (arg) => {
      expect(arg).toBe("server");
      done();
    });
    
    // Emit event from client
    clientSocket.emit("hello", "world");
  });
  
  test("should handle notification events", (done) => {
    // Mock data
    const notificationData = {
      title: "Test Notification",
      message: "This is a test notification",
      userId: "test-user-id",
    };
    
    // Spy on notification saving function
    const saveSpy = jest.spyOn(global, "saveNotificationToDB").mockResolvedValue(undefined);
    
    // Listen for notification event on server
    serverSocket.on("notification", (data) => {
      // Verify data
      expect(data).toEqual(notificationData);
      
      // Verify notification was saved
      expect(saveSpy).toHaveBeenCalledWith(notificationData);
      
      done();
    });
    
    // Emit notification from client
    clientSocket.emit("notification", notificationData);
  });
  
  // More tests...
});
```

### 8.2. Integration Testing Socket với Redis

```typescript
// Backend/tests/integration/socketRedis.test.ts
import { createServer } from "http";
import { Server } from "socket.io";
import Client from "socket.io-client";
import { createAdapter } from "@socket.io/redis-adapter";
import Redis from "ioredis";
import jwt from "jsonwebtoken";

describe("Socket.IO Redis Adapter", () => {
  let io: Server;
  let httpServer: any;
  let clientSocket1: any;
  let clientSocket2: any;
  let pubClient: Redis;
  let subClient: Redis;
  
  beforeAll(async () => {
    // Create Redis clients
    pubClient = new Redis();
    subClient = pubClient.duplicate();
    
    // Create HTTP server
    httpServer = createServer();
    
    // Create Socket.IO server with Redis adapter
    io = new Server(httpServer, {
      adapter: createAdapter(pubClient, subClient),
    });
    
    // Add authentication middleware
    io.use((socket, next) => {
      const token = socket.handshake.auth.token;
      if (token) {
        try {
          const decoded = jwt.verify(token, "test-secret");
          socket.data.user = decoded;
          next();
        } catch (error) {
          next(new Error("Authentication error"));
        }
      } else {
        next(new Error("Authentication error"));
      }
    });
    
    // Handle connections
    io.on("connection", (socket) => {
      // Join room based on user ID
      if (socket.data.user?.id) {
        socket.join(`user:${socket.data.user.id}`);
      }
      
      // Handle room messages
      socket.on("roomMessage", (data) => {
        io.to(data.room).emit("message", {
          text: data.text,
          from: socket.data.user?.id,
        });
      });
    });
    
    // Start server
    await new Promise<void>((resolve) => {
      httpServer.listen(() => {
        resolve();
      });
    });
    
    // Get port
    const port = (httpServer.address() as any).port;
    
    // Create test tokens
    const testToken1 = jwt.sign(
      { id: "user1", role: "user" },
      "test-secret"
    );
    
    const testToken2 = jwt.sign(
      { id: "user2", role: "user" },
      "test-secret"
    );
    
    // Connect clients
    clientSocket1 = Client(`http://localhost:${port}`, {
      auth: { token: testToken1 },
    });
    
    clientSocket2 = Client(`http://localhost:${port}`, {
      auth: { token: testToken2 },
    });
    
    // Wait for connections
    await Promise.all([
      new Promise<void>((resolve) => {
        clientSocket1.on("connect", resolve);
      }),
      new Promise<void>((resolve) => {
        clientSocket2.on("connect", resolve);
      }),
    ]);
  });
  
  afterAll(() => {
    io.close();
    clientSocket1.close();
    clientSocket2.close();
    httpServer.close();
    pubClient.quit();
    subClient.quit();
  });
  
  test("should broadcast to room through Redis adapter", (done) => {
    const room = "testRoom";
    const messageText = "Hello Redis Room";
    
    // Join room
    clientSocket1.emit("join", room);
    clientSocket2.emit("join", room);
    
    // Listen for messages on client 2
    clientSocket2.on("message", (data) => {
      expect(data.text).toBe(messageText);
      expect(data.from).toBe("user1");
      done();
    });
    
    // Send message from client 1 to room
    clientSocket1.emit("roomMessage", {
      room,
      text: messageText,
    });
  });
  
  // More tests...
});
```

## 9. Scale Socket.IO với Multiple Workers

```typescript
// Backend/server.ts
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import cluster from "cluster";
import os from "os";
import { createAdapter } from "@socket.io/redis-adapter";
import Redis from "ioredis";

const numCPUs = os.cpus().length;

if (cluster.isPrimary) {
  console.log(`Master ${process.pid} is running`);
  
  // Fork workers
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
  
  cluster.on("exit", (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died`);
    // Fork a new worker to replace the dead one
    cluster.fork();
  });
} else {
  // Workers share the TCP connection
  const app = require("./app").default;
  
  // Create HTTP server
  const server = http.createServer(app);
  
  // Redis clients for Socket.IO adapter
  const pubClient = new Redis(process.env.REDIS_URL);
  const subClient = pubClient.duplicate();
  
  // Create Socket.IO server with Redis adapter
  const io = new SocketIOServer(server, {
    adapter: createAdapter(pubClient, subClient),
    cors: {
      origin: process.env.ORIGIN?.split(",") || ["http://localhost:3000"],
      credentials: true,
    },
  });
  
  // Set up Socket.IO handlers
  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id} on worker ${process.pid}`);
    
    // Join room based on user ID
    if (socket.data.user?.id) {
      socket.join(`user:${socket.data.user.id}`);
      
      // Store socket ID in Redis
      pubClient.set(
        `user:${socket.data.user.id}:socket`,
        socket.id,
        "EX",
        3600
      );
    }
    
    // Handle events...
    
    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id} on worker ${process.pid}`);
      
      // Remove socket ID from Redis
      if (socket.data.user?.id) {
        pubClient.del(`user:${socket.data.user.id}:socket`);
      }
    });
  });
  
  // Start server
  const PORT = process.env.PORT || 8000;
  server.listen(PORT, () => {
    console.log(`Worker ${process.pid} started on port ${PORT}`);
  });
}
```

## 10. Monitoring Socket.IO Performance

```typescript
// Backend/utils/socketMonitoring.ts
import { Server } from "socket.io";
import { performance } from "perf_hooks";
import { promisify } from "util";
import { RedisClient } from "redis";

// Monitoring metrics
interface SocketMetrics {
  totalConnections: number;
  messagesPerSecond: number;
  averageResponseTime: number;
  peakConnections: number;
  totalMessages: number;
  activeRooms: number;
  errorRate: number;
}

// Setup socket monitoring
export const setupSocketMonitoring = (io: Server, redisClient: RedisClient) => {
  let metrics: SocketMetrics = {
    totalConnections: 0,
    messagesPerSecond: 0,
    averageResponseTime: 0,
    peakConnections: 0,
    totalMessages: 0,
    activeRooms: 0,
    errorRate: 0,
  };
  
  // Track connection count
  const connectionCounter = () => {
    const connectionCount = io.sockets.sockets.size;
    metrics.totalConnections = connectionCount;
    
    // Update peak connections
    if (connectionCount > metrics.peakConnections) {
      metrics.peakConnections = connectionCount;
    }
    
    // Store metrics in Redis
    redisClient.set("socket:metrics", JSON.stringify(metrics));
  };
  
  // Track message count and response time
  let messageCount = 0;
  let totalResponseTime = 0;
  let errorCount = 0;
  
  // Monitor events
  io.on("connection", (socket) => {
    // Increment connection count
    connectionCounter();
    
    // Track response time for all events
    socket.use((packet, next) => {
      const startTime = performance.now();
      
      // After event is processed, calculate response time
      socket.on(packet[0] + ":response", () => {
        const endTime = performance.now();
        const responseTime = endTime - startTime;
        
        totalResponseTime += responseTime;
        messageCount++;
        
        // Update metrics
        metrics.totalMessages = messageCount;
        metrics.averageResponseTime = totalResponseTime / messageCount;
      });
      
      next();
    });
    
    // Track errors
    socket.on("error", () => {
      errorCount++;
      metrics.errorRate = errorCount / messageCount;
    });
    
    // When socket disconnects
    socket.on("disconnect", () => {
      connectionCounter();
    });
  });
  
  // Update messages per second every second
  setInterval(() => {
    // Calculate messages per second
    metrics.messagesPerSecond = messageCount;
    messageCount = 0;
    
    // Calculate active rooms
    metrics.activeRooms = io.sockets.adapter.rooms.size;
    
    // Store metrics in Redis
    redisClient.set("socket:metrics", JSON.stringify(metrics));
  }, 1000);
  
  // API endpoint to get metrics
  return {
    getMetrics: async (): Promise<SocketMetrics> => {
      const getAsync = promisify(redisClient.get).bind(redisClient);
      const metricsStr = await getAsync("socket:metrics");
      return metricsStr ? JSON.parse(metricsStr) : metrics;
    },
  };
};
```