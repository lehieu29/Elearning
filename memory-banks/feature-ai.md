# Tính Năng AI Trong Dự Án E-Learning

Dự án E-Learning tích hợp Google Generative AI (Gemini) để cung cấp trải nghiệm học tập tương tác và thông minh. Tính năng AI được sử dụng chủ yếu trong việc tạo transcript, trả lời câu hỏi liên quan đến nội dung bài học, và sinh tóm tắt.

## 1. Tổng Quan Tính Năng AI

### Các tính năng chính
- Chat bot trợ giúp trong quá trình học
- Tự động sinh transcript (phụ đề) cho video bài giảng
- Tóm tắt nội dung bài học
- Trả lời câu hỏi dựa trên ngữ cảnh của bài học
- Giải đáp thắc mắc về lập trình và kỹ thuật

### Công nghệ sử dụng
- **Google Generative AI (Gemini)**: Model gemini-1.0-pro-001
- **Socket.IO**: Giao tiếp realtime giữa client và server
- **FFmpeg**: Xử lý video và audio để tạo transcript

## 2. Kiến Trúc AI

```mermaid
graph TD
    A[Client] -->|1. Gửi câu hỏi| B[Frontend: AiChat Component]
    B -->|2. Gửi prompt| C[Google Generative AI API]
    C -->|3. Trả về kết quả| B
    B -->|4. Hiển thị câu trả lời| A
    
    E[Video Bài Học] -->|1. Upload| F[Backend: Controller]
    F -->|2. Tách audio| G[FFmpeg]
    G -->|3. Audio file| H[AI Transcription Service]
    H -->|4. Lưu transcript| I[Database]
    
    A -->|1. Yêu cầu transcript| J[Backend API]
    J -->|2. Lấy transcript| I
    J -->|3. Trả về transcript| A
    A -->|4. Dùng transcript làm ngữ cảnh| B
```

## 3. Cài Đặt Components

### 3.1. Frontend AI Chat Component

```tsx
// Frontend/app/components/AI/AiChat.tsx
"use client";
import React, { FC, useState, useEffect } from "react";
import { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";
import { styles } from "@/app/styles/style";
import { ThemeSwitcher } from "@/app/utils/ThemeSwitcher";
import Link from "next/link";
import { useGetTranscriptMutation } from "@/redux/features/courses/coursesApi";
import { useParams } from "next/navigation";
import Loader from "../Loader/Loader";

type Props = {
  videoName: string;
};

interface Message {
  text: string;
  role: "user" | "bot";
  timestamp: Date;
}

interface ChatSession {
  sendMessage: (message: string) => Promise<any>;
}

const AiChat: FC<Props> = ({ videoName }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState("");
  const [chat, setChat] = useState<ChatSession | null>(null);
  const [transcript, setTranscript] = useState<string | undefined>("");
  const [courseName, setCourseName] = useState<string | undefined>("");
  const [err, setErr] = useState<string | null>(null);
  
  // Cấu hình API key và model
  const MODEL_NAME = "gemini-1.0-pro-001";
  const API_KEY = "AIzaSyBTFD1gqjU7NPBnPX88RiFBC3kQSDVqy2c";
  const genAI = new GoogleGenerativeAI(API_KEY);
  
  const courseId = useParams();
  const [getTranscript, { data, isLoading, error }] =
    useGetTranscriptMutation();

  // Cấu hình generation parameters
  const generationConfig = {
    temperature: 0.9,
    topK: 1,
    topP: 1,
    maxOutputTokens: 2048,
  };
  
  // Cấu hình safety settings
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

  // Khởi tạo chat session
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
        setErr("Something Went Wrong!");
      }
    };
    initChat();
  }, [transcript, courseName]);

  // Xử lý gửi tin nhắn
  const handleSendMessage = async () => {
    try {
      const userMessage: Message = {
        text: userInput,
        role: "user",
        timestamp: new Date(),
      };

      setMessages((prevMessages) => [...prevMessages, userMessage]);
      setUserInput("");
      
      if (chat) {
        let trs: string = transcript
          ? `Use following Transcript if required NOT Compulsory - "${transcript}" and`
          : "and";
          
        // Tạo prompt với ngữ cảnh
        const prompt: string = `QUESTION - ${userInput} Answer the following question and provide answer in context to concepts associated with ${videoName} or ${courseName} only, 
        ${trs} 
        If question is out of context or not related to programming then just Send Response as "Please ask questions only related to ${videoName}".`;
        
        // Gửi prompt đến AI
        const result = await chat.sendMessage(prompt);
        
        // Thêm câu trả lời vào danh sách tin nhắn
        const botMessage: Message = {
          text: result.response.text(),
          role: "bot",
          timestamp: new Date(),
        };
        
        setMessages((prevMessages) => [...prevMessages, botMessage]);
      }
    } catch (err: any) {
      setErr("Something is wrong");
    }
  };

  // Xử lý phím Enter
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault(); // prevent adding new Line
      handleSendMessage();
    }
  };

  // Lấy transcript của video
  const handleGetTranscript = async () => {
    try {
      const result = await getTranscript({
        id: courseId?.id,
        videoName,
      });
      
      if (result && "data" in result) {
        let trs: string | undefined = result?.data?.transcript;
        setTranscript(trs);

        let cname: string | undefined = result?.data?.courseName;
        setCourseName(cname);
      }
      
      // Tạo câu trả lời tóm tắt ngay khi có transcript
      if (chat && courseName) {
        let noTRS: string = `mention "No transcript available for course!, But still here is a short summary on ${videoName}" and provide 3-4 line summary for ${videoName}`;
        let yesTRS: string = `Summarize the following transcript - ${transcript} in context to ${courseName}`;
        const prompt: string = transcript ? yesTRS : noTRS;
        
        const result = await chat.sendMessage(prompt);
        
        const botMessage: Message = {
          text: result.response.text(),
          role: "bot",
          timestamp: new Date(),
        };
        
        setMessages((prevMessages) => [...prevMessages, botMessage]);
      } else {
        alert("Try Again");
      }
    } catch (err) {
      console.error("Error fetching transcript:", err);
    }
  };

  return (
    <>
      {isLoading ? (
        <Loader />
      ) : (
        <div className="flex flex-col h-screen p-4">
          <button
            className="p-2 bg-red-500 self-center rounded-full text-white hover:bg-red-400"
            onClick={handleGetTranscript}
          >
            Summarize
          </button>
          <div className="flex justify-between items-center mb-4">
            <Link href={"/"} className={`${styles.title} !text-2xl`}>
              ELearning AI BOT 🤖
            </Link>
            <div className="flex space-x-2">
              <ThemeSwitcher />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto rounded-md p-2">
            {/* Hiển thị tin nhắn */}
            {[...messages].map((msg, index) => (
              <div
                key={index}
                className={`mb-4 ${
                  msg.role === "user" ? "text-right" : "text-left"
                }`}
              >
                <span
                  className={` ${
                    msg.role === "user"
                      ? `${styles.input}`
                      : " rounded-lg font-Josefin p-2 text-xl text-black dark:text-white bg-blue-200 dark:bg-blue-950 "
                  }`}
                >
                  {msg.text}
                </span>
                <p className={`text-xs ${styles.label} mt-1`}>
                  {msg.role === "bot" ? "Bot" : "You"} -{" "}
                  {msg.timestamp.toLocaleTimeString()}
                </p>
              </div>
            ))}
            {err && <div className="text-red-500 text-sm mb-4">{err}</div>}
            
            {/* Input tin nhắn */}
            <div className="flex items-center mt-4">
              <input
                type="text"
                placeholder="Type your message..."
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={handleKeyPress}
                className={`${styles.input} !rounded-l-md !flex-1 !p-2 !border-b !border-t !border-l focus:outline-none focus:border-blue-500 `}
              />
              <button
                onClick={handleSendMessage}
                className={`p-2 cursor-pointer bg-[#2190ff] text-white rounded-r-md ml-1 mt-1  hover:bg-opacity-80 focus:outline-none`}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AiChat;
```

### 3.2. Backend API cho Transcript

```typescript
// Backend/controller/course.controller.ts
export const getTranscript = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id, videoName } = req.body;

      // Tìm khóa học
      const course = await CourseModel.findById(id);
      if (!course) {
        return next(new ErrorHandler("Course not found", 404));
      }

      // Tìm subtitle trong database
      const subtitle = await SubtitleModel.findOne({
        courseId: id,
        fileName: videoName,
      });

      // Nếu có subtitle, trả về
      if (subtitle) {
        return res.status(200).json({
          success: true,
          transcript: subtitle.transcript,
          courseName: course.name,
        });
      }

      // Nếu không có, trả về rỗng
      return res.status(200).json({
        success: true,
        transcript: "",
        courseName: course.name,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);
```

### 3.3. Backend Service cho Transcript Generation

```typescript
// Backend/services/ai.service.ts
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs-extra';
import path from 'path';
import { GoogleGenerativeAI } from "@google/generative-ai";

// Khởi tạo Google Generative AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-1.0-pro-001" });

export const generateTranscript = async (videoPath: string, fileName: string, courseId: string): Promise<string> => {
  try {
    // Thư mục lưu file tạm
    const tempDir = path.join(__dirname, '../temp');
    await fs.ensureDir(tempDir);

    // Đường dẫn cho file audio
    const audioPath = path.join(tempDir, `${path.basename(videoPath, path.extname(videoPath))}.mp3`);

    // Trích xuất audio từ video
    await new Promise<void>((resolve, reject) => {
      ffmpeg(videoPath)
        .output(audioPath)
        .audioCodec('libmp3lame')
        .on('end', () => resolve())
        .on('error', (err) => reject(err))
        .run();
    });

    // Đọc file audio dưới dạng base64
    const audioData = await fs.readFile(audioPath, { encoding: 'base64' });

    // Gửi yêu cầu đến AI để tạo transcript
    const prompt = `
      You are a professional transcription service. 
      Transcribe the following audio to text.
      Return only the transcript, without any additional explanation or notes.
      Please maintain any technical terms and code snippets if they appear in the audio.
    `;

    const result = await model.generateContent([
      prompt,
      { audio: audioData }
    ]);

    const transcript = result.response.text();

    // Xóa file tạm
    await fs.remove(audioPath);

    // Lưu transcript vào database
    const subtitle = new SubtitleModel({
      courseId,
      fileName,
      transcript,
    });

    await subtitle.save();

    return transcript;
  } catch (error) {
    console.error('Error generating transcript:', error);
    throw error;
  }
};
```

### 3.4. Backend Model cho Subtitle

```typescript
// Backend/models/subtitle.model.ts
import mongoose, { Document, Model, Schema } from "mongoose";

export interface ISubtitle extends Document {
  courseId: string;
  fileName: string;
  transcript: string;
}

const subtitleSchema = new Schema<ISubtitle>({
  courseId: {
    type: String,
    required: true,
  },
  fileName: {
    type: String,
    required: true,
  },
  transcript: {
    type: String,
    required: true,
  },
}, {
  timestamps: true,
});

// Tạo index để tăng tốc độ truy vấn
subtitleSchema.index({ courseId: 1, fileName: 1 }, { unique: true });

const SubtitleModel: Model<ISubtitle> = mongoose.model("Subtitle", subtitleSchema);

export default SubtitleModel;
```

## 4. Luồng Xử Lý Chính

### 4.1. Tạo Transcript Cho Video

```mermaid
sequenceDiagram
    participant Admin
    participant Backend
    participant FFmpeg
    participant GoogleAI
    participant Database
    
    Admin->>Backend: Upload video bài học
    Backend->>Backend: Lưu video trên Cloudinary
    Backend->>FFmpeg: Trích xuất audio từ video
    FFmpeg->>Backend: Trả về file audio
    Backend->>GoogleAI: Gửi file audio + prompt
    GoogleAI->>Backend: Trả về transcript
    Backend->>Database: Lưu transcript
```

1. **Upload Video**:
   - Admin upload video khóa học lên hệ thống
   - Backend lưu video trên Cloudinary

2. **Tạo Transcript**:
   - Backend sử dụng FFmpeg để trích xuất audio từ video
   - Audio được gửi đến Google Generative AI với prompt yêu cầu tạo transcript
   - AI trả về transcript dạng text

3. **Lưu Trữ**:
   - Transcript được lưu vào MongoDB với courseId và fileName
   - Sẵn sàng được sử dụng cho tính năng AI Chat

### 4.2. AI Chat Trong Khóa Học

```mermaid
sequenceDiagram
    participant Student
    participant Frontend
    participant Backend
    participant MongoDB
    participant GoogleAI
    
    Student->>Frontend: Mở AI Chat trong bài học
    Frontend->>Backend: Yêu cầu transcript (videoName, courseId)
    Backend->>MongoDB: Tìm transcript
    MongoDB->>Backend: Trả về transcript
    Backend->>Frontend: Gửi transcript
    Frontend->>GoogleAI: Khởi tạo chat session với context
    GoogleAI->>Frontend: Tạo tóm tắt nội dung
    Frontend->>Student: Hiển thị tóm tắt
    
    Student->>Frontend: Đặt câu hỏi
    Frontend->>GoogleAI: Gửi prompt với context từ transcript
    GoogleAI->>Frontend: Trả về câu trả lời
    Frontend->>Student: Hiển thị câu trả lời
```

1. **Khởi Tạo Chat**:
   - Học viên mở AI Chat khi xem video bài học
   - Frontend gọi API để lấy transcript của video
   - Frontend khởi tạo chat session với Google Generative AI

2. **Tóm Tắt Nội Dung**:
   - Khi nhấn nút "Summarize", AI sẽ tự động tạo tóm tắt nội dung dựa trên transcript
   - Tóm tắt được hiển thị như tin nhắn đầu tiên trong chat

3. **Trò Chuyện AI**:
   - Học viên đặt câu hỏi liên quan đến nội dung bài học
   - Frontend gửi prompt đến AI với context từ transcript
   - AI trả về câu trả lời dựa trên nội dung bài học

## 5. Các Prompt Templates

### 5.1. Prompt cho Tóm Tắt Nội Dung

```typescript
// Khi có transcript
const summaryPromptWithTranscript = `
Summarize the following transcript - ${transcript} in context to ${courseName}
Provide a concise summary that highlights the main points, key concepts, and important examples from the lecture.
The summary should be structured with bullet points for key concepts.
Keep the tone educational and informative.
`;

// Khi không có transcript
const summaryPromptWithoutTranscript = `
mention "No transcript available for course!, But still here is a short summary on ${videoName}" and provide 3-4 line summary for ${videoName}
Based on the title, predict what the content might cover and provide a general overview of that topic.
Focus on standard concepts associated with this topic in programming education.
`;
```

### 5.2. Prompt cho Câu Hỏi

```typescript
const questionPrompt = `
QUESTION - ${userQuestion} 
Answer the following question and provide answer in context to concepts associated with ${videoName} or ${courseName} only,
${transcript ? `Use following Transcript if required NOT Compulsory - "${transcript}" and` : "and"}
If question is out of context or not related to programming then just Send Response as "Please ask questions only related to ${videoName}".

Keep the answer concise but thorough, focusing on educational value.
Include code examples if appropriate for programming questions.
If a concept mentioned in the question appears in the transcript, reference and explain it.
If the question asks for clarification on something in the transcript, provide that clarification.
`;
```

## 6. Cài Đặt API và Redux

### 6.1. Redux API Slice cho Transcript

```typescript
// Frontend/redux/features/courses/coursesApi.ts
export const coursesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Các endpoints khác...
    
    getTranscript: builder.mutation({
      query: ({ id, videoName }) => ({
        url: "get-transcript",
        method: "POST",
        body: { id, videoName },
        credentials: "include" as const,
      }),
    }),
  }),
});

export const {
  // Các hooks khác...
  useGetTranscriptMutation,
} = coursesApi;
```

### 6.2. Backend Route

```typescript
// Backend/routes/course.route.ts
import express from "express";
import { authorizeRoles, isAuthenticated } from "../middleware/auth";
import { 
  // Các controllers khác...
  getTranscript, 
  generateVideoSubtitle 
} from "../controller/course.controller";

const courseRouter = express.Router();

// Các routes khác...

// Get transcript
courseRouter.post("/get-transcript", isAuthenticated, getTranscript);

// Generate subtitle (admin only)
courseRouter.post(
  "/generate-video-subtitle",
  isAuthenticated,
  authorizeRoles("admin"),
  generateVideoSubtitle
);

export default courseRouter;
```

## 7. Phân Tích Hiệu Năng và Tối Ưu

### 7.1. Vấn Đề Hiệu Năng

1. **Độ Trễ API**: 
   - Google Generative AI có thể có độ trễ cao khi xử lý prompt dài
   - Việc tạo transcript cho video dài cũng tiêu tốn thời gian và tài nguyên

2. **Kích Thước Transcript**:
   - Transcript của video dài có thể rất lớn, vượt quá giới hạn của prompt

3. **Sử Dụng Token**:
   - Google Generative AI có giới hạn token, cần tối ưu việc sử dụng

### 7.2. Giải Pháp Tối Ưu

1. **Caching**:
   - Cache transcript trong database để tránh tạo lại mỗi lần
   - Cache các câu trả lời thường gặp

2. **Chunk Transcript**:
   - Chia transcript thành các đoạn nhỏ hơn
   - Chỉ gửi các đoạn liên quan đến câu hỏi

3. **Batch Processing**:
   - Tạo transcript trong background job
   - Sử dụng queue để xử lý nhiều yêu cầu tạo transcript

4. **Tối Ưu Prompt**:
   - Sử dụng prompt ngắn gọn và hiệu quả
   - Chỉ gửi context cần thiết

```typescript
// Ví dụ: Chunk transcript
const chunkTranscript = (transcript: string, maxChunkSize: number = 2000): string[] => {
  const words = transcript.split(' ');
  const chunks: string[] = [];
  let currentChunk = '';

  for (const word of words) {
    if ((currentChunk + ' ' + word).length <= maxChunkSize) {
      currentChunk += (currentChunk ? ' ' : '') + word;
    } else {
      chunks.push(currentChunk);
      currentChunk = word;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks;
};

// Sử dụng chunks khi gửi prompt
const findRelevantChunk = (chunks: string[], question: string): string => {
  // Tìm chunk liên quan nhất đến câu hỏi
  // (Có thể sử dụng embedding hoặc keyword matching)
  // ...
  return mostRelevantChunk;
};
```

## 8. Hướng Phát Triển Trong Tương Lai

### 8.1. Các Tính Năng Mới

1. **AI Tutor Cá Nhân Hóa**:
   - Tạo lộ trình học tập cá nhân hóa dựa trên tiến độ và sở thích của học viên
   - Đề xuất khóa học và bài học phù hợp

2. **Sinh Nội Dung Tự Động**:
   - Tự động tạo quiz và bài tập từ nội dung bài học
   - Tạo flashcards và tài liệu ôn tập

3. **Phân Tích Dữ Liệu Học Tập**:
   - Phân tích hành vi học tập của học viên
   - Đưa ra gợi ý cải thiện hiệu quả học tập

4. **Đa Ngôn Ngữ**:
   - Dịch nội dung khóa học sang nhiều ngôn ngữ
   - Hỗ trợ trò chuyện AI bằng nhiều ngôn ngữ

### 8.2. Cải Tiến AI

1. **Fine-tuning Model**:
   - Fine-tune model Gemini với dữ liệu từ lĩnh vực cụ thể
   - Tạo model chuyên biệt cho từng chủ đề (lập trình, thiết kế, v.v.)

2. **Embedding Vector Database**:
   - Sử dụng embedding để lưu trữ và tìm kiếm nội dung
   - Tìm kiếm semantic thay vì keyword

3. **Multi-modal AI**:
   - Phân tích hình ảnh và video để hiểu nội dung
   - Tạo giải thích cho các đoạn code và diagram

4. **Realtime AI Feedback**:
   - Cung cấp phản hồi realtime khi học viên làm bài tập
   - Phát hiện và sửa lỗi trong code

## 9. Các Thách Thức và Giải Pháp

### 9.1. Thách Thức

1. **Độ Chính Xác của Transcript**:
   - Transcript có thể không chính xác đối với các thuật ngữ kỹ thuật
   - Sai sót trong phát âm và ngôn ngữ chuyên ngành

2. **Hallucination của AI**:
   - AI có thể tạo ra thông tin không có trong nội dung khóa học
   - Thiếu chính xác trong các câu trả lời kỹ thuật

3. **Chi Phí API**:
   - Chi phí API của Google Generative AI tăng theo số lượng người dùng
   - Tạo transcript cho video dài rất tốn kém

4. **Ngôn Ngữ Đa Dạng**:
   - Học viên có thể đặt câu hỏi bằng nhiều ngôn ngữ khác nhau
   - Nội dung khóa học có thể bằng nhiều ngôn ngữ

### 9.2. Giải Pháp

1. **Kiểm Tra và Chỉnh Sửa Transcript**:
   - Cho phép giảng viên chỉnh sửa transcript
   - Sử dụng dictionary của thuật ngữ kỹ thuật để cải thiện độ chính xác

2. **Prompt Engineering Nâng Cao**:
   - Thiết kế prompt giảm thiểu hallucination
   - Thêm hướng dẫn cụ thể cho AI để tránh tạo thông tin sai

3. **Quản Lý Chi Phí API**:
   - Sử dụng caching để giảm số lượng gọi API
   - Thiết lập giới hạn sử dụng theo gói dịch vụ

4. **Hỗ Trợ Đa Ngôn Ngữ**:
   - Tự động phát hiện ngôn ngữ của câu hỏi
   - Sử dụng prompt đa ngôn ngữ