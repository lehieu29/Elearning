"use client";
import { useState, useEffect } from "react";
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";

export interface Message {
  text: string;
  role: "user" | "bot";
  timestamp: Date;
}

export interface ChatSession {
  sendMessage: (message: string) => Promise<any>;
}

export interface ChatServiceResult {
  messages: Message[];
  userInput: string;
  setUserInput: (input: string) => void;
  handleSendMessage: () => Promise<void>;
  handleKeyPress: (e: React.KeyboardEvent) => void;
  handleGetSummary: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export const useChatService = (
  videoName: string,
  courseId: string,
  user: any,
  getTranscriptFn: any
): ChatServiceResult => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState("");
  const [chat, setChat] = useState<ChatSession | null>(null);
  const [transcript, setTranscript] = useState<string | undefined>("");
  const [courseName, setCourseName] = useState<string | undefined>("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const MODEL_NAME = "gemini-1.5-flash";
  // Use API key from environment variables instead of hardcoded
  const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
  const genAI = new GoogleGenerativeAI(API_KEY);

  const generationConfig = {
    temperature: 0.9,
    topK: 1,
    topP: 1,
    maxOutputTokens: 2048,
  };

  const safetySettings = [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
  ];

  useEffect(() => {
    const initChat = async () => {
      try {
        const newChat: any = await genAI
          .getGenerativeModel({ model: MODEL_NAME })
          .startChat({
            generationConfig,
            safetySettings,
            history: [...messages].map((msg: Message) => ({
              parts: [{ text: msg.text }],
              role: msg.role === "bot" ? "model" : msg.role,
            })),
          });
        setChat(newChat);
      } catch (err: any) {
        setError("Could not connect to AI. Please try again later.");
      }
    };
    initChat();
  }, [transcript, courseName]);

  const handleSendMessage = async () => {
    if (!userInput.trim()) return;
    
    try {
      setIsLoading(true);
      const userMessage: Message = {
        text: userInput,
        role: "user",
        timestamp: new Date(),
      };

      setMessages((prevMessages) => [...prevMessages, userMessage]);
      setUserInput("");
      
      if (chat) {
        let trs: string = transcript
          ? `Use following Transcript if required (NOT COMPULSORY) - "${transcript}" and`
          : "and";
          
        const prompt: string = `QUESTION - ${userInput} Answer the following question and provide answer in context to concepts associated with ${videoName} or ${courseName} only, 
        ${trs} 
        If question is out of context or not related to programming then just Send Response as "Please ask questions only related to ${videoName}".`;
        
        const result = await chat.sendMessage(prompt);
        const botMessage: Message = {
          text: result.response.text(),
          role: "bot",
          timestamp: new Date(),
        };
        
        setMessages((prevMessages) => [...prevMessages, botMessage]);
      }
    } catch (err: any) {
      setError("An error occurred while sending the message");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault(); // prevent adding new Line
      handleSendMessage();
    }
  };

  const handleGetSummary = async () => {
    try {
      setIsLoading(true);
      const result = await getTranscriptFn({
        id: courseId,
        videoName,
      });

      if (result?.data) {
        let trs: string | undefined = result?.data?.transcript;
        setTranscript(trs);

        let cname: string | undefined = result?.data?.courseName;
        setCourseName(cname);

        if (chat) {
          let noTRS: string = `mention "No transcript available for course!, But still here is a short summary on ${videoName}" and provide 3-4 line summary for ${videoName}`;
          let yesTRS: string = `Summarize the following transcript - ${transcript} in context to ${courseName}`;
          const prompt: string = transcript ? yesTRS : noTRS;
          
          const chatResult = await chat.sendMessage(prompt);
          const botMessage: Message = {
            text: chatResult.response.text(),
            role: "bot",
            timestamp: new Date(),
          };
          
          setMessages((prevMessages) => [...prevMessages, botMessage]);
        } else {
          setError("Could not connect to AI. Please try again");
        }
      }
    } catch (err) {
      setError("Error fetching transcript");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    messages,
    userInput,
    setUserInput,
    handleSendMessage,
    handleKeyPress,
    handleGetSummary,
    isLoading,
    error,
  };
};
