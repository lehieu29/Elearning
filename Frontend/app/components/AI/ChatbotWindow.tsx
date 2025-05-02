"use client";
import React, { FC } from "react";
import { styles } from "@/app/styles/style";
import { AiOutlineClose } from "react-icons/ai";
import { BiSend } from "react-icons/bi";
import { VscLoading } from "react-icons/vsc";
import { useChatService, Message } from "@/app/utils/services/chatService";
import Image from "next/image";
import { format } from "timeago.js";

interface ChatbotWindowProps {
  videoName: string;
  courseId: string;
  user: any;
  onClose: () => void;
  getTranscriptFn: any;
}

const ChatbotWindow: FC<ChatbotWindowProps> = ({
  videoName,
  courseId,
  user,
  onClose,
  getTranscriptFn,
}) => {
  const {
    messages,
    userInput,
    setUserInput,
    handleSendMessage,
    handleKeyPress,
    handleGetSummary,
    isLoading,
    error,
  } = useChatService(videoName, courseId, user, getTranscriptFn);

  return (
    <div className="fixed bottom-20 right-5 w-80 md:w-96 h-[500px] bg-white dark:bg-slate-800 rounded-lg shadow-2xl overflow-hidden z-50 flex flex-col border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-blue-500 text-white">
        <div className="flex items-center">
          <Image
            src="/assests/AIBot.jpg"
            width={30}
            height={30}
            alt="AI Bot"
            className="rounded-full mr-2"
          />
          <h3 className="font-medium">ELearning AI Bot</h3>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleGetSummary}
            className="text-xs bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded"
            disabled={isLoading}
          >
            Summarize
          </button>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200"
            aria-label="Close"
          >
            <AiOutlineClose size={20} />
          </button>
        </div>
      </div>

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-gray-500 dark:text-gray-400">
            <Image
              src="/assests/AIBot.jpg"
              width={80}
              height={80}
              alt="AI Bot"
              className="rounded-full mb-3 opacity-70"
            />
            <p className="font-medium">Welcome to AI Bot</p>
            <p className="text-sm mt-2">
              Ask any question about the video &quot;{videoName}&quot;
            </p>
          </div>
        ) : (
          messages.map((msg: Message, index: number) => (
            <div
              key={index}
              className={`flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  msg.role === "user"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 dark:bg-gray-700 dark:text-white"
                }`}
              >
                <div className="text-sm">{msg.text}</div>
                <div
                  className={`text-xs mt-1 ${
                    msg.role === "user"
                      ? "text-blue-100"
                      : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {msg.role === "user" ? "You" : "AI"} • {format(msg.timestamp)}
                </div>
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-center">
            <VscLoading className="animate-spin text-blue-500" size={24} />
          </div>
        )}
        {error && (
          <div className="text-red-500 text-sm text-center">{error}</div>
        )}
      </div>

      {/* Input area */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-3">
        <div className="relative flex items-center">
          <input
            type="text"
            placeholder="Type your question..."
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={isLoading}
            className="w-full pr-10 py-2 px-3 rounded-full border border-gray-300 dark:border-gray-600 focus:outline-none focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
          <button
            onClick={handleSendMessage}
            disabled={!userInput.trim() || isLoading}
            className="absolute right-2 text-blue-500 hover:text-blue-600 disabled:text-gray-400"
            aria-label="Send"
          >
            <BiSend size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatbotWindow;
