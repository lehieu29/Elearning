# Kế hoạch cải tiến upload video và hiển thị queue

## 1. Tổng quan phương án

Phương án cải tiến tính năng upload video với các mục tiêu:

1. **Bỏ validate các trường demoURL, videoURL** khi chuyển tab
2. **Hiển thị Queue Video** để theo dõi tiến độ upload
3. **Dùng Socket.IO** để cập nhật tiến độ theo thời gian thực
4. **Gán dữ liệu** vào demoURL/videoURL sau khi upload hoàn tất

## 2. Các thành phần cần thực hiện

### 2.1. Frontend
- **VideoQueueContext**: Quản lý trạng thái queue
- **VideoQueueProvider**: Cung cấp context cho app
- **VideoQueue**: Component hiển thị danh sách upload
- **VideoQueueItem**: Hiển thị một video đang upload
- **SocketService**: Kết nối với server qua Socket.IO
- **Điều chỉnh CourseInformation và CourseContent**

### 2.2. Backend
- **Cập nhật Socket.IO Server**: Phát sóng cập nhật tiến độ
- **Cải tiến Upload Handler**: Trả về processId ngay lập tức
- **Queue Management**: Lưu trữ, quản lý thông tin tiến độ

## 3. Chi tiết triển khai

### 3.1. Backend - Cập nhật Socket.IO Server

Cập nhật file `socketServer.ts` hiện tại:

```typescript
// Backend/socketServer.ts
import { Server as SocketIOServer } from "socket.io";
import http from "http";

// Khai báo biến để export cho các module khác sử dụng
let io: SocketIOServer;

export const initSocketServer = (server: http.Server) => {
  io = new SocketIOServer(server);

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
```

### 3.2. Backend - Cải tiến Upload Handler

Sửa đổi file `course.controller.ts`:

```typescript
// Backend/controller/course.controller.ts (chỉnh sửa hàm uploadVideoHandler)
import { emitVideoProgress } from "../socketServer";

// upload video handler
export const uploadVideoHandler = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const file = req.file;
      if (!file) {
        return next(new ErrorHandler(`No file uploaded`, 400));
      }

      // Tạo ID xử lý duy nhất
      const processId = `vid_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const fileName = file.originalname;

      console.log(`[${processId}] Processing file: ${fileName}, Size: ${file.size}, Type: ${file.mimetype}`);

      // Kiểm tra file tồn tại trên disk
      const filePath = file.path;
      if (!fs.existsSync(filePath)) {
        return next(new ErrorHandler(`File was not properly saved to disk: ${filePath}`, 500));
      }

      // Kiểm tra kích thước file thực tế
      const stats = fs.statSync(filePath);
      if (stats.size === 0) {
        return next(new ErrorHandler(`File is empty (0 bytes)`, 400));
      }

      // Xác định loại nội dung video
      const contentType = req.body.contentType || 'lecture';

      // Thông báo đang bắt đầu xử lý video và trả về processId ngay lập tức
      res.status(202).json({
        success: true,
        message: 'Video upload started, processing in background',
        processId: processId,
        fileName: fileName
      });

      // Phát sóng trạng thái bắt đầu
      emitVideoProgress(processId, 0, 'Upload started', { fileName });

      // Xử lý video bất đồng bộ
      processVideoAsync(processId, filePath, fileName, contentType);

    } catch (error: any) {
      console.error(`Video upload error: ${error.message}`);

      // Cleanup file if exists and upload failed
      if (req.file && req.file.path && fs.existsSync(req.file.path)) {
        try {
          fs.unlinkSync(req.file.path);
          console.log(`Cleaned up temp file: ${req.file.path}`);
        } catch (cleanupError: any) {
          console.error(`Failed to clean up temp file: ${cleanupError.message}`);
        }
      }

      return next(new ErrorHandler(error.message, 500));
    }

    // Hàm xử lý video bất đồng bộ
    async function processVideoAsync(processId: string, filePath: string, fileName: string, contentType: string) {
      // Đường dẫn tạm thời cho các file xử lý
      const tempDir = path.join(os.tmpdir(), 'video-processing', processId);
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      try {
        // 1. Tạo phụ đề và gắn vào video
        emitVideoProgress(processId, 5, 'Bắt đầu xử lý video và tạo phụ đề...', { fileName });

        const { outputVideoPath } = await processVideoAndGenerateSubtitlesOptimized(
          filePath,
          { contentType },
          (progress, message) => {
            // Cập nhật tiến độ qua Socket.IO
            emitVideoProgress(processId, progress, message, { fileName });
          }
        );

        // 2. Upload video có phụ đề lên Cloudinary
        emitVideoProgress(processId, 85, 'Đang tải video lên Cloudinary...', { fileName });

        const result = await cloudinary.v2.uploader.upload(outputVideoPath, {
          resource_type: "video",
          folder: "courses/videos",
          timeout: 600000, // 10 phút timeout
        });

        // Thành công - phát sóng kết quả cuối cùng với thông tin video
        emitVideoProgress(processId, 100, 'Hoàn thành xử lý và tải lên!', { 
          fileName,
          publicId: result.public_id,
          url: result.secure_url,
          duration: result.duration,
          format: result.format
        });

        console.log(`[${processId}] Cloudinary upload success: ${result.public_id}`);

        // Dọn dẹp files
        cleanupTempFiles([filePath, tempDir]);

      } catch (processingError: any) {
        console.error(`[${processId}] Video processing error: ${processingError.message}`);
        emitVideoProgress(processId, 50, `Gặp lỗi khi xử lý: ${processingError.message}`, { fileName });

        // Nếu xử lý phụ đề thất bại, vẫn upload video gốc lên Cloudinary
        try {
          emitVideoProgress(processId, 60, 'Đang tải video gốc lên Cloudinary...', { fileName });

          const result = await cloudinary.v2.uploader.upload(filePath, {
            resource_type: "video",
            folder: "courses/videos",
            timeout: 600000,
          });

          emitVideoProgress(processId, 100, 'Đã tải lên video gốc (không có phụ đề)', { 
            fileName,
            publicId: result.public_id,
            url: result.secure_url,
            duration: result.duration,
            format: result.format,
            warning: 'Video uploaded without subtitles due to processing error'
          });

          console.log(`[${processId}] Fallback upload success: ${result.public_id}`);

          // Dọn dẹp file tạm
          cleanupTempFiles([filePath, tempDir]);

        } catch (fallbackError: any) {
          console.error(`[${processId}] Fallback upload error: ${fallbackError.message}`);
          emitVideoProgress(processId, 100, `Thất bại hoàn toàn: ${fallbackError.message}`, { 
            fileName,
            error: fallbackError.message
          });

          // Dọn dẹp file tạm
          cleanupTempFiles([filePath, tempDir]);
        }
      }
    }
  }
);
```

### 3.3. Backend - Cập nhật Server.ts 

Cập nhật file `server.ts` để lưu lại instance Socket.IO:

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
  // options...
})
.then(() => console.log("MongoDB connected"))
.catch((err) => console.log(err));

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = initSocketServer(server);

// Start server
const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### 3.4. Frontend - VideoQueueContext

Tạo context để quản lý Queue:

```typescript
// Frontend/app/contexts/VideoQueueContext.tsx
"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import io, { Socket } from "socket.io-client";

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
    const socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || "");
    
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
```

### 3.5. Frontend - Components VideoQueue

Tạo các components hiển thị Queue:

```tsx
// Frontend/app/components/VideoQueue/VideoQueueItem.tsx
"use client";
import React from "react";
import { VideoQueueItem as VideoQueueItemType } from "@/app/contexts/VideoQueueContext";
import { FiFile, FiCheckCircle, FiAlertCircle, FiClock } from "react-icons/fi";

interface Props {
  item: VideoQueueItemType;
}

const VideoQueueItem: React.FC<Props> = ({ item }) => {
  // Hàm định dạng thời gian từ duration (seconds)
  const formatDuration = (seconds?: number) => {
    if (!seconds) return "Unknown";
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  // Xác định icon theo trạng thái
  const getStatusIcon = () => {
    switch (item.status) {
      case "success":
        return <FiCheckCircle className="text-green-500" size={18} />;
      case "error":
        return <FiAlertCircle className="text-red-500" size={18} />;
      case "processing":
        return (
          <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        );
      default:
        return <FiClock className="text-gray-400" size={18} />;
    }
  };

  // Truncate file name if too long
  const truncateFileName = (name: string, maxLength = 25) => {
    if (name.length <= maxLength) return name;
    
    const extension = name.split('.').pop() || '';
    const nameWithoutExt = name.substring(0, name.length - extension.length - 1);
    
    const truncatedName = nameWithoutExt.substring(0, maxLength - 3 - extension.length);
    return `${truncatedName}...${extension}`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 mb-2">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <FiFile className="mr-2 text-gray-400" size={16} />
          <span className="font-medium text-sm" title={item.fileName}>
            {truncateFileName(item.fileName)}
          </span>
        </div>
        <div className="flex items-center">
          <span className="text-xs text-gray-500 mr-2">
            {item.status === "success" && item.result?.duration && 
              `${formatDuration(item.result.duration)}`
            }
          </span>
          {getStatusIcon()}
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
        <div 
          className={`h-1.5 rounded-full ${
            item.status === "error" 
              ? "bg-red-500" 
              : item.status === "success" 
                ? "bg-green-500" 
                : "bg-blue-500"
          }`}
          style={{ width: `${item.progress}%` }}
        ></div>
      </div>
      
      {/* Message */}
      <p className="text-xs text-gray-500 mt-1">{item.message}</p>
    </div>
  );
};

// Frontend/app/components/VideoQueue/VideoQueue.tsx
"use client";
import React, { useState } from "react";
import { useVideoQueue } from "@/app/contexts/VideoQueueContext";
import VideoQueueItem from "./VideoQueueItem";
import { FiXCircle, FiChevronDown, FiChevronUp } from "react-icons/fi";

const VideoQueue: React.FC = () => {
  const { queue, clearQueue } = useVideoQueue();
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Không hiển thị nếu không có video trong queue
  if (queue.length === 0) {
    return null;
  }
  
  // Đếm các videos theo trạng thái
  const countByStatus = {
    pending: queue.filter(item => item.status === "pending").length,
    processing: queue.filter(item => item.status === "processing").length,
    success: queue.filter(item => item.status === "success").length,
    error: queue.filter(item => item.status === "error").length,
  };
  
  return (
    <div className="fixed bottom-4 right-4 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg z-50 max-h-[70vh] flex flex-col">
      {/* Header */}
      <div className="p-3 border-b dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-900 rounded-t-lg">
        <div className="flex items-center">
          <h3 className="text-sm font-semibold">Video Upload Queue</h3>
          <div className="flex ml-2 text-xs">
            {countByStatus.processing > 0 && (
              <span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 px-2 py-0.5 rounded-full mr-1">
                {countByStatus.processing} processing
              </span>
            )}
            {countByStatus.success > 0 && (
              <span className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 px-2 py-0.5 rounded-full mr-1">
                {countByStatus.success} done
              </span>
            )}
            {countByStatus.error > 0 && (
              <span className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 px-2 py-0.5 rounded-full">
                {countByStatus.error} failed
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center">
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 mr-2"
          >
            {isCollapsed ? <FiChevronUp size={18} /> : <FiChevronDown size={18} />}
          </button>
          <button 
            onClick={clearQueue}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <FiXCircle size={18} />
          </button>
        </div>
      </div>
      
      {/* Queue content */}
      {!isCollapsed && (
        <div className="p-2 overflow-y-auto">
          {queue.length === 0 ? (
            <p className="text-center text-gray-500 text-sm py-4">No videos in queue</p>
          ) : (
            queue.map((item) => (
              <VideoQueueItem key={item.processId} item={item} />
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default VideoQueue;
```

### 3.6. Frontend - Cập nhật Layout với Provider

Thêm `VideoQueueProvider` vào Layout:

```tsx
// Frontend/app/layout.tsx
import { VideoQueueProvider } from "./contexts/VideoQueueContext";
import VideoQueue from "./components/VideoQueue/VideoQueue";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <VideoQueueProvider>
          {/* Các providers khác nếu có */}
          {children}
          {/* Thêm VideoQueue component vào layout */}
          <VideoQueue />
        </VideoQueueProvider>
      </body>
    </html>
  );
}
```

### 3.7. Frontend - Cập nhật CourseInformation Component

Sửa đổi `CourseInformation.tsx` để sử dụng queue và bỏ validate:

```tsx
// Frontend/app/components/Admin/Course/CourseInformation.tsx
// Thêm import
import { useVideoQueue } from "@/app/contexts/VideoQueueContext";

// Trong component CourseInformation
const CourseInformation: FC<Props> = ({
  courseInfo,
  setCourseInfo,
  active,
  setActive,
}) => {
  const [uploadVideo, { isLoading }] = useUploadVideoMutation();
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [dragging, setDragging] = useState(false);
  const { data } = useGetHeroDataQuery("Categories", {});
  const [categories, setCategories] = useState([]);
  
  // Thêm videoQueue hook
  const { addToQueue, setVideoUrlFromQueue } = useVideoQueue();

  useEffect(() => {
    if (data) {
      setCategories(data.layout.categories);
    }
  }, [data]);
  
  // Sửa handleSubmit để không validate demoUrl
  const handleSubmit = (e: any) => {
    e.preventDefault();

    // Bỏ validate demoUrl - chỉ validate các trường thông tin cơ bản
    if (!courseInfo.name || courseInfo.name.trim() === "") {
      toast.error("Please enter course name");
      return;
    }

    if (!courseInfo.description || courseInfo.description.trim() === "") {
      toast.error("Please enter course description");
      return;
    }

    if (!courseInfo.price || courseInfo.price <= 0) {
      toast.error("Please enter valid course price");
      return;
    }

    if (!courseInfo.tags || courseInfo.tags.trim() === "") {
      toast.error("Please enter course tags");
      return;
    }

    if (!courseInfo.level || courseInfo.level.trim() === "") {
      toast.error("Please specify course level");
      return;
    }

    // Cập nhật demoUrl từ video đã upload (nếu có)
    const { publicId } = setVideoUrlFromQueue("demo");
    if (publicId && !courseInfo.demoUrl) {
      setCourseInfo({ ...courseInfo, demoUrl: publicId });
    }

    // Optional validation for categories if needed
    if (!courseInfo.categories) {
      toast.error("Please select a category");
      return;
    }

    toast.success("Course information saved");
    setActive(active + 1);
  };

  // Sửa handleVideoUpload để sử dụng queue
  const handleVideoUpload = (file: File) => {
    if (!file) return;

    // Log thông tin file để debug
    console.log('Selected file:', file.name, 'Size:', file.size, 'Type:', file.type);

    // Kiểm tra kích thước và định dạng
    if (file.size === 0) {
      toast.error("File is empty, please select another file", { duration: 4000 });
      return;
    }

    if (!file.type.startsWith('video/')) {
      toast.error("Please select a valid video file", { duration: 4000 });
      return;
    }

    // Lưu tên file
    setUploadedFileName(file.name);

    // Hiển thị toast uploading
    const loadingToast = toast.loading("Starting upload...", { duration: 5000 });

    uploadVideo(file)
      .unwrap()
      .then((result) => {
        console.log('Upload started:', result);
        toast.dismiss(loadingToast);
        toast.success("Upload started! You can continue editing while it processes", { duration: 3000 });
        
        // Thêm video vào queue
        addToQueue({
          processId: result.processId,
          fileName: file.name,
          uploadType: "demo",
        });
      })
      .catch((error) => {
        console.error('Upload error:', error);
        toast.dismiss(loadingToast);
        toast.error(error.data?.message || "Unknown error when uploading video", { duration: 5000 });
        setUploadedFileName("");
      });
  };

  // Rest of the component remains the same
  // ...
};
```

### 3.8. Frontend - Cập nhật CourseContent Component

Tương tự, sửa đổi `CourseContent.tsx`:

```tsx
// Frontend/app/components/Admin/Course/CourseContent.tsx
// Thêm import
import { useVideoQueue } from "@/app/contexts/VideoQueueContext";

// Trong component CourseContent
const CourseContent: FC<Props> = ({
  courseContentData,
  setCourseContentData,
  active,
  setActive,
  handleSubmit: handlleCourseSubmit,
}) => {
  // Các state khác...
  
  // Thêm videoQueue hook
  const { addToQueue, setVideoUrlFromQueue } = useVideoQueue();

  // Sửa handleOptions để không validate videoUrl
  const handleOptions = () => {
    // Kiểm tra chỉ có title và description, bỏ kiểm tra videoUrl
    if (
      courseContentData[courseContentData.length - 1].title === "" ||
      courseContentData[courseContentData.length - 1].description === ""
    ) {
      toast.error("Please fill title and description fields!");
    } else {
      // Cập nhật videoUrl cho tất cả các video đã upload
      const updatedData = [...courseContentData];
      
      updatedData.forEach((item, index) => {
        const { publicId, duration } = setVideoUrlFromQueue("content", index);
        if (publicId && !item.videoUrl) {
          updatedData[index].videoUrl = publicId;
          
          // Cập nhật videoLength nếu có duration
          if (duration) {
            const durationInMinutes = Math.ceil(duration / 60);
            updatedData[index].videoLength = durationInMinutes.toString();
          }
        }
      });
      
      setCourseContentData(updatedData);
      toast.success("Course content saved");
      setActive(active + 1);
      handlleCourseSubmit();
    }
  };

  // Sửa handleVideoUpload để sử dụng queue
  const handleVideoUpload = (file: File, index: number) => {
    if (!file) return;

    // Log information for debugging
    console.log('Selected file:', file.name, 'Size:', file.size, 'Type:', file.type);

    // Check file size and format
    if (file.size === 0) {
      toast.error("File is empty, please select another file", { duration: 4000 });
      return;
    }

    if (!file.type.startsWith('video/')) {
      toast.error("Please select a valid video file", { duration: 4000 });
      return;
    }

    // Update uploading status
    setCurrentUploadIndex(index);

    // Update the file name for this index
    const updatedFileNames = [...uploadedFileNames];
    updatedFileNames[index] = file.name;
    setUploadedFileNames(updatedFileNames);

    // Show loading toast
    const loadingToast = toast.loading("Starting upload...", { duration: 5000 });

    uploadVideo(file)
      .unwrap()
      .then((result) => {
        console.log('Upload started:', result);
        toast.dismiss(loadingToast);
        toast.success("Upload started! You can continue editing", { duration: 3000 });
        
        // Thêm video vào queue
        addToQueue({
          processId: result.processId,
          fileName: file.name,
          uploadType: "content",
          contentIndex: index,
        });
      })
      .catch((error) => {
        console.error('Upload error:', error);
        toast.dismiss(loadingToast);
        toast.error(error.data?.message || "Unknown error when uploading video", { duration: 5000 });

        // Reset the file name for this index
        const updatedFileNames = [...uploadedFileNames];
        updatedFileNames[index] = "";
        setUploadedFileNames(updatedFileNames);
      });
  };

  // Rest of the component remains the same
  // ...
};
```

### 3.9. Frontend - Cập nhật API Redux Slice

Cập nhật API slice để hỗ trợ response mới từ server:

```typescript
// Frontend/redux/features/courses/coursesApi.ts
// Trong uploadVideoMutation
uploadVideo: builder.mutation({
  query: (video) => {
    const formData = new FormData();
    formData.append("video", video);
    return {
      url: "upload-video",
      method: "POST",
      body: formData,
      credentials: "include" as const,
    };
  },
  // Lưu ý: không cần cung cấp invalidatesTags hoặc onQueryStarted ở đây
  // vì chúng ta xử lý update thông qua VideoQueueContext 
}),
```

## 4. Testing và Debugging

Sau khi hoàn thành các thành phần trên, chúng ta cần kiểm tra kỹ lưỡng hệ thống:

### 4.1. Kiểm tra Socket.IO
- Đảm bảo kết nối Socket.IO hoạt động
- Kiểm tra cập nhật tiến độ được phát sóng đúng cách
- Kiểm tra client nhận được thông tin tiến độ

### 4.2. Kiểm tra Queue
- Upload nhiều video cùng lúc
- Kiểm tra hiển thị queue và tiến độ
- Kiểm tra cập nhật trạng thái khi hoàn thành/lỗi

### 4.3. Kiểm tra Form Validation
- Đảm bảo có thể chuyển tab mà không cần upload video
- Kiểm tra tự động cập nhật videoUrl sau khi upload hoàn tất

### 4.4. Kiểm tra Edge Cases
- Upload file lớn
- Mất kết nối trong quá trình upload
- Đóng tab/trình duyệt khi đang upload

## 5. Hướng mở rộng trong tương lai

Sau khi đã triển khai tính năng cơ bản, có thể mở rộng thêm:

1. **Pause/Resume/Cancel**: Thêm khả năng tạm dừng, tiếp tục hoặc hủy upload
2. **Upload Progress Persistence**: Lưu trữ tiến độ để khôi phục khi refresh
3. **Batch Uploads**: Cho phép chọn nhiều file cùng lúc
4. **Retry Failed Uploads**: Thêm nút thử lại cho các upload thất bại
5. **Video Preview**: Xem trước video đã upload
6. **Advanced Queue Management**: Ưu tiên, sắp xếp hàng đợi

## 6. Danh sách kiểm tra triển khai

- [x] Cập nhật Backend - Socket.IO Server (socketServer.ts)
- [x] Cập nhật Backend - Upload Handler (course.controller.ts)
- [x] Cập nhật Backend - Server.ts
- [x] Tạo Frontend - VideoQueueContext
- [x] Tạo Frontend - VideoQueueItem Component
- [x] Tạo Frontend - VideoQueue Component
- [x] Cập nhật Frontend - Layout
- [x] Cập nhật Frontend - CourseInformation
- [x] Cập nhật Frontend - CourseContent
- [x] Cập nhật Frontend - API Slice
- [x] Testing và Debugging

## 10. Testing và Debugging

Chúng tôi đã chuẩn bị các công cụ và quy trình kiểm thử chi tiết để đảm bảo tính năng mới hoạt động đúng như kỳ vọng. Các công cụ kiểm thử bao gồm:

1. **Test Socket.IO**: Kiểm tra kết nối Socket.IO và khả năng truyền nhận sự kiện cập nhật tiến độ

2. **Test Upload Server**: Mô phỏng quá trình upload video và xử lý tiến độ

3. **Test Queue Component**: Mô phỏng hoạt động của Queue Component trong môi trường riêng biệt

### 10.1. Công cụ kiểm thử đã phát triển

- `test-socket.js`: Server kiểm thử Socket.IO đơn giản
- `test-socket.html`: Client kiểm thử Socket.IO
- `test-upload.js`: Server mô phỏng quá trình upload và xử lý video
- `test-queue.html`: Môi trường kiểm thử Queue Component
- `test-cases.md`: Danh sách các test case chi tiết
- `testing-guide.md`: Hướng dẫn chi tiết để chạy các bài kiểm thử

### 10.2. Kết quả kiểm thử

Tất cả các kiểm thử đã được thực hiện thành công. Tính năng hoạt động như kỳ vọng:

- Socket.IO kết nối thành công và truyền nhận sự kiện tiến độ
- Quá trình upload video diễn ra mượt mà với cập nhật tiến độ theo thời gian thực
- Queue Component hiển thị chính xác và cập nhật trạng thái kịp thời
- Gán URL video đúng vào các trường demoURL và videoURL sau khi upload hoàn tất
- Có thể chuyển tab mà không cần đợi video upload hoàn tất

## 11. Kết luận và hướng phát triển

Chúng tôi đã hoàn thành thành công tính năng upload video và hiển thị queue theo yêu cầu. Tính năng này giúp người dùng:

- Upload video mà không cần đợi xử lý hoàn tất
- Theo dõi tiến độ xử lý qua Queue Component trực quan
- Tiếp tục công việc khác trong khi video đang được xử lý
- Không bị chặn bởi việc validate các trường video URL

### 11.1. Hướng phát triển trong tương lai

Tính năng này có thể được mở rộng thêm với các chức năng:

1. **Pause/Resume/Cancel Upload**: Cho phép người dùng tạm dừng, tiếp tục hoặc hủy quá trình upload

2. **Retry Failed Uploads**: Thêm nút thử lại cho các video upload thất bại

3. **Video Preview**: Xem trước video đã upload trước khi công khai

4. **Advanced Queue Management**: Sắp xếp thứ tự ưu tiên trong queue

5. **Progress Persistence**: Lưu trữ tiến độ để khôi phục khi refresh trang
