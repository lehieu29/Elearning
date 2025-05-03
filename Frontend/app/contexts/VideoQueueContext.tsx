"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { createSocket } from "../utils/socketConfig";
import { Socket } from "socket.io-client";

// Khai báo kiểu dữ liệu cho video trong queue
export interface VideoQueueItem {
  processId: string;
  fileName: string;
  progress: number;
  message: string;
  status: "pending" | "processing" | "success" | "error";
  result?: {
    publicId?: string;
    url?: string;
    duration?: number;
    format?: string;
    error?: string;
    warning?: string;
  };
  uploadType: "demo" | "content";
  contentIndex?: number; // Chỉ dùng cho content videos
  timestamp: number;
}

interface VideoQueueContextType {
  queue: VideoQueueItem[];
  addToQueue: (item: Omit<VideoQueueItem, "progress" | "message" | "status" | "timestamp">) => void;
  updateQueueItem: (processId: string, data: Partial<VideoQueueItem>) => void;
  removeFromQueue: (processId: string) => void;
  clearQueue: () => void;
  setVideoUrlFromQueue: (
    uploadType: "demo" | "content", 
    contentIndex?: number
  ) => { publicId?: string; duration?: number };
}

// Tạo context
const VideoQueueContext = createContext<VideoQueueContextType | undefined>(undefined);

// Provider Component
export const VideoQueueProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [queue, setQueue] = useState<VideoQueueItem[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);

  // Kết nối Socket.IO khi component mount
  useEffect(() => {
    // Kết nối đến Socket.IO server
    const socketInstance = createSocket({
      path: "/socket.io",
      transports: ["polling", "websocket"]
    });
    
    socketInstance.on("connect", () => {
      console.log("Socket connected for video queue updates");
    });
    
    socketInstance.on("disconnect", () => {
      console.log("Socket disconnected from video queue updates");
    });
    
    // Lắng nghe cập nhật tiến độ video
    socketInstance.on("videoProgress", (data: any) => {
      console.log("Video progress update:", data);
      
      // Cập nhật item trong queue
      setQueue((prevQueue) => {
        // Tìm video trong queue
        const index = prevQueue.findIndex(item => item.processId === data.processId);
        
        if (index !== -1) {
          // Cập nhật thông tin
          const updatedQueue = [...prevQueue];
          updatedQueue[index] = {
            ...updatedQueue[index],
            progress: data.progress,
            message: data.message,
            status: data.progress === 100 
              ? data.result?.error ? "error" : "success" 
              : "processing",
            result: data.result,
            timestamp: data.timestamp,
          };

          // Thông báo khi hoàn thành
          if (data.progress === 100) {
            if (data.result?.error) {
              toast.error(`Upload failed: ${data.message}`);
            } else {
              toast.success(`Upload complete: ${updatedQueue[index].fileName}`);
            }
          }
          
          return updatedQueue;
        }
        
        return prevQueue;
      });
    });
    
    setSocket(socketInstance);
    
    // Cleanup khi unmount
    return () => {
      socketInstance.disconnect();
    };
  }, []);

  // Thêm video vào queue
  const addToQueue = (item: Omit<VideoQueueItem, "progress" | "message" | "status" | "timestamp">) => {
    const newItem: VideoQueueItem = {
      ...item,
      progress: 0,
      message: "Waiting to process...",
      status: "pending",
      timestamp: Date.now(),
    };
    
    setQueue((prev) => [...prev, newItem]);
  };

  // Cập nhật thông tin của một video trong queue
  const updateQueueItem = (processId: string, data: Partial<VideoQueueItem>) => {
    setQueue((prev) => 
      prev.map((item) => 
        item.processId === processId ? { ...item, ...data } : item
      )
    );
  };

  // Xóa video khỏi queue
  const removeFromQueue = (processId: string) => {
    setQueue((prev) => prev.filter((item) => item.processId !== processId));
  };

  // Xóa toàn bộ queue
  const clearQueue = () => {
    setQueue([]);
  };

  // Lấy thông tin publicId và duration từ video đã upload thành công
  // để cập nhật vào form
  const setVideoUrlFromQueue = (uploadType: "demo" | "content", contentIndex?: number) => {
    // Tìm video phù hợp nhất trong queue (mới nhất, đã hoàn thành, đúng loại)
    const matchedVideos = queue.filter(item => 
      item.uploadType === uploadType && 
      item.status === "success" &&
      (uploadType === "content" ? item.contentIndex === contentIndex : true)
    );
    
    if (matchedVideos.length === 0) {
      return { publicId: undefined, duration: undefined };
    }
    
    // Lấy video mới nhất
    const latestVideo = matchedVideos.sort((a, b) => b.timestamp - a.timestamp)[0];
    
    return { 
      publicId: latestVideo.result?.publicId,
      duration: latestVideo.result?.duration
    };
  };

  return (
    <VideoQueueContext.Provider
      value={{
        queue,
        addToQueue,
        updateQueueItem,
        removeFromQueue,
        clearQueue,
        setVideoUrlFromQueue,
      }}
    >
      {children}
    </VideoQueueContext.Provider>
  );
};

// Custom hook để sử dụng context
export const useVideoQueue = () => {
  const context = useContext(VideoQueueContext);
  if (context === undefined) {
    throw new Error("useVideoQueue must be used within a VideoQueueProvider");
  }
  return context;
};
