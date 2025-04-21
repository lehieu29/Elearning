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

export default VideoQueueItem;