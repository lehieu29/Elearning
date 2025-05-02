"use client";
import React from "react";

interface ChatbotIconProps {
  onClick: () => void;
  isActive?: boolean;
}

const ChatbotIcon: React.FC<ChatbotIconProps> = ({ onClick, isActive = false }) => {
  return (
    <div
      className={`fixed bottom-5 right-5 w-12 h-12 rounded-full ${
        isActive ? "bg-blue-600" : "bg-blue-500"
      } flex items-center justify-center cursor-pointer hover:bg-blue-600 transition-all z-50 shadow-lg`}
      onClick={onClick}
      aria-label="Open AI Chatbot"
      role="button"
    >
      <span className="text-2xl" role="img" aria-label="Robot">🤖</span>
      {isActive && (
        <span className="absolute top-0 right-0 w-3 h-3 bg-green-500 rounded-full"></span>
      )}
    </div>
  );
};

export default ChatbotIcon;
