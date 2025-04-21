# Chiến Lược Xử Lý Lỗi (Error Handling)

Dự án E-Learning sử dụng một hệ thống xử lý lỗi toàn diện để đảm bảo trải nghiệm người dùng mượt mà và khả năng debugging hiệu quả. Tài liệu này mô tả chi tiết các chiến lược xử lý lỗi được áp dụng trong dự án.

## 1. Tổng Quan Chiến Lược Xử Lý Lỗi

Hệ thống xử lý lỗi của dự án E-Learning tuân theo các nguyên tắc sau:

1. **Nhất quán**: Sử dụng cùng một cách tiếp cận cho toàn bộ dự án
2. **Chi tiết**: Cung cấp thông tin lỗi đầy đủ để debugging
3. **Thân thiện**: Hiển thị thông báo lỗi dễ hiểu cho người dùng
4. **Bảo mật**: Không để lộ thông tin nhạy cảm qua lỗi
5. **Ghi log**: Lưu trữ lỗi để phân tích sau

## 2. Backend Error Handling

### 2.1. Custom Error Handler Class

```typescript
// Backend/utils/ErrorHandler.ts
class ErrorHandler extends Error {
  statusCode: number;
  
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    
    // Captures the stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

export default ErrorHandler;
```

### 2.2. Async Error Wrapper

```typescript
// Backend/middleware/catchAsyncErrors.ts
import { Request, Response, NextFunction } from "express";

const catchAsyncErrors = (theFunc: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(theFunc(req, res, next)).catch(next);
  };
};

export default catchAsyncErrors;
```

### 2.3. Error Middleware

```typescript
// Backend/middleware/error.ts
import { Request, Response, NextFunction } from "express";
import ErrorHandler from "../utils/ErrorHandler";

export const ErrorMiddleware = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || "Internal Server Error";

  // Wrong MongoDB ID error
  if (err.name === "CastError") {
    const message = `Resource not found. Invalid: ${err.path}`;
    err = new ErrorHandler(message, 400);
  }

  // Duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `Duplicate ${field} entered`;
    err = new ErrorHandler(message, 400);
  }

  // Wrong JWT error
  if (err.name === "JsonWebTokenError") {
    const message = `Json Web Token is invalid, try again`;
    err = new ErrorHandler(message, 401);
  }

  // JWT expired error
  if (err.name === "TokenExpiredError") {
    const message = `Json Web Token is expired, try again`;
    err = new ErrorHandler(message, 401);
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const validationErrors = Object.values(err.errors).map(
      (val: any) => val.message
    );
    const message = validationErrors.join(". ");
    err = new ErrorHandler(message, 400);
  }

  // Log error in development
  if (process.env.NODE_ENV === "development") {
    console.error("ERROR:", err);
  }

  // Send response
  res.status(err.statusCode).json({
    success: false,
    message: err.message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    error: err,
  });
};
```

### 2.4. Áp Dụng Trong Controllers

```typescript
// Backend/controller/user.controller.ts
import { Request, Response, NextFunction } from "express";
import ErrorHandler from "../utils/ErrorHandler";
import catchAsyncErrors from "../middleware/catchAsyncErrors";
import userModel from "../models/user.model";

// Sử dụng catchAsyncErrors để bắt lỗi
export const getUserInfo = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?._id;
      
      // Validator
      if (!userId) {
        return next(new ErrorHandler("User ID not found", 400));
      }
      
      const user = await userModel.findById(userId);
      
      // Not found error
      if (!user) {
        return next(new ErrorHandler("User not found", 404));
      }
      
      // Success response
      res.status(200).json({
        success: true,
        user,
      });
    } catch (error: any) {
      // Catch other errors and pass to error middleware
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// Không sử dụng catchAsyncErrors (không khuyến nghị)
export const loginUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    
    // Validation
    if (!email || !password) {
      return next(new ErrorHandler("Please enter email and password", 400));
    }
    
    // Logic...
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 500));
  }
};
```

### 2.5. Validation Error Handling

```typescript
// Validation schema cho request body
import Joi from "joi";

const userValidationSchema = Joi.object({
  name: Joi.string().required().min(3).max(30)
    .messages({
      "string.base": "Name should be a string",
      "string.empty": "Name is required",
      "string.min": "Name should have a minimum length of {#limit}",
      "string.max": "Name should have a maximum length of {#limit}",
      "any.required": "Name is required"
    }),
  email: Joi.string().email().required()
    .messages({
      "string.email": "Please provide a valid email",
      "any.required": "Email is required"
    }),
  password: Joi.string().min(6).required()
    .messages({
      "string.min": "Password should have a minimum length of {#limit}",
      "any.required": "Password is required"
    })
});

// Middleware validation
export const validateUserInput = (req: Request, res: Response, next: NextFunction) => {
  const { error } = userValidationSchema.validate(req.body, { abortEarly: false });
  
  if (error) {
    const message = error.details.map((detail) => detail.message).join(", ");
    return next(new ErrorHandler(message, 400));
  }
  
  next();
};

// Áp dụng middleware
userRouter.post("/registration", validateUserInput, registrationUser);
```

### 2.6. API Error Response Format

```typescript
// Standard error response format
{
  "success": false,
  "message": "User not found",
  "stack": "Error: User not found\n    at ..." // Only in development
}

// Validation error format
{
  "success": false,
  "message": "Name is required, Password should have a minimum length of 6"
}
```

## 3. Frontend Error Handling

### 3.1. Redux RTK Query Error Handling

```typescript
// Frontend/redux/features/auth/authApi.ts
import { apiSlice } from "../api/apiSlice";
import { toast } from "react-hot-toast";

export const authApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (data) => ({
        url: "login",
        method: "POST",
        body: data,
        credentials: "include" as const,
      }),
      // Handle success
      async onQueryStarted(arg, { queryFulfilled, dispatch }) {
        try {
          const result = await queryFulfilled;
          // Success actions...
        } catch (error: any) {
          // Không cần xử lý ở đây, được xử lý ở global error handler
        }
      },
    }),
    // Other endpoints...
  }),
});

// Global error handler for RTK Query errors
// In the apiSlice.ts file
const baseQueryWithErrorHandler = async (args: any, api: any, extraOptions: any) => {
  const result = await baseQuery(args, api, extraOptions);
  
  if (result.error) {
    // Extract error message
    let errorMessage = "An error occurred";
    
    if (result.error.data?.message) {
      errorMessage = result.error.data.message;
    } else if (typeof result.error.data === "string") {
      errorMessage = result.error.data;
    } else if (result.error.error) {
      errorMessage = result.error.error;
    }
    
    // Display toast with error message
    toast.error(errorMessage);
    
    // Handle specific error codes
    if (result.error.status === 401) {
      // Handle unauthorized (e.g., logout user or redirect to login)
    }
  }
  
  return result;
};
```

### 3.2. Axios Error Handling

```typescript
// Frontend/app/utils/api.ts
import axios from "axios";
import { toast } from "react-hot-toast";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_SERVER_URI,
  withCredentials: true,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add headers or other config
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Extract and format error message
    let errorMessage = "An error occurred";
    
    if (error.response) {
      // Server responded with an error
      if (error.response.data.message) {
        errorMessage = error.response.data.message;
      } else if (typeof error.response.data === "string") {
        errorMessage = error.response.data;
      }
      
      // Handle specific status codes
      if (error.response.status === 401) {
        // Handle unauthorized
      } else if (error.response.status === 404) {
        // Handle not found
      }
    } else if (error.request) {
      // Request was made but no response received
      errorMessage = "No response from server. Please check your connection.";
    } else {
      // Error in setting up the request
      errorMessage = error.message;
    }
    
    // Display error message
    toast.error(errorMessage);
    
    // Log error in development
    if (process.env.NODE_ENV === "development") {
      console.error("API Error:", error);
    }
    
    return Promise.reject(error);
  }
);

export default api;
```

### 3.3. React Error Boundary

```tsx
// Frontend/app/utils/ErrorBoundary.tsx
"use client";
import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render shows the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error to an error reporting service
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return this.props.fallback || (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="max-w-md w-full p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">
              Something went wrong
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              We're sorry, but an error occurred. Please try refreshing the page.
            </p>
            <div className="mb-4 p-4 bg-gray-100 dark:bg-gray-700 rounded overflow-auto">
              <pre className="text-sm text-gray-800 dark:text-gray-200">
                {this.state.error?.toString()}
              </pre>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
```

### 3.4. Form Validation Errors

```tsx
// Frontend/app/components/Auth/SignUp.tsx
"use client";
import React, { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "react-hot-toast";
import { useRegisterMutation } from "@/redux/features/auth/authApi";

// Validation schema
const signUpSchema = Yup.object({
  name: Yup.string()
    .required("Họ tên là bắt buộc")
    .min(3, "Họ tên ít nhất 3 ký tự")
    .max(30, "Họ tên tối đa 30 ký tự"),
  email: Yup.string()
    .email("Email không hợp lệ")
    .required("Email là bắt buộc"),
  password: Yup.string()
    .required("Mật khẩu là bắt buộc")
    .min(6, "Mật khẩu ít nhất 6 ký tự"),
});

const SignUp = () => {
  const [register, { isLoading }] = useRegisterMutation();
  
  const formik = useFormik({
    initialValues: {
      name: "",
      email: "",
      password: "",
    },
    validationSchema: signUpSchema,
    onSubmit: async (values) => {
      try {
        const response = await register(values).unwrap();
        toast.success("Đăng ký thành công! Vui lòng kiểm tra email để kích hoạt tài khoản.");
        // Handle success...
      } catch (error: any) {
        // Error được xử lý bởi RTK Query error handler
        // Có thể xử lý thêm ở đây nếu cần
      }
    },
  });
  
  return (
    <form onSubmit={formik.handleSubmit}>
      <div className="mb-4">
        <label className="block text-gray-700 dark:text-gray-200 mb-2">
          Họ tên
        </label>
        <input
          type="text"
          name="name"
          value={formik.values.name}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          className={`w-full px-3 py-2 border rounded-lg ${
            formik.touched.name && formik.errors.name
              ? "border-red-500"
              : "border-gray-300 dark:border-gray-600"
          }`}
        />
        {formik.touched.name && formik.errors.name && (
          <p className="text-red-500 text-sm mt-1">{formik.errors.name}</p>
        )}
      </div>
      
      {/* Email field */}
      {/* Password field */}
      
      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition"
      >
        {isLoading ? "Đang xử lý..." : "Đăng ký"}
      </button>
    </form>
  );
};
```

### 3.5. Error States và Loading

```tsx
// Frontend/app/components/Course/CourseDetails.tsx
"use client";
import React from "react";
import { useGetCourseDetailsQuery } from "@/redux/features/courses/coursesApi";
import Loader from "../Loader/Loader";
import ErrorDisplay from "../Error/ErrorDisplay";

const CourseDetails = ({ courseId }: { courseId: string }) => {
  const { data, isLoading, error } = useGetCourseDetailsQuery(courseId);
  
  // Hiển thị loading state
  if (isLoading) {
    return <Loader />;
  }
  
  // Hiển thị error state
  if (error) {
    return (
      <ErrorDisplay
        title="Không thể tải khóa học"
        message={
          "data" in error
            ? (error.data as any)?.message || "Đã xảy ra lỗi khi tải khóa học."
            : "Đã xảy ra lỗi khi tải khóa học."
        }
        retryAction={() => window.location.reload()}
      />
    );
  }
  
  // Hiển thị empty state
  if (!data || !data.course) {
    return (
      <div className="text-center py-10">
        <h2 className="text-2xl font-bold">Không tìm thấy khóa học</h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Khóa học này không tồn tại hoặc đã bị xóa.
        </p>
      </div>
    );
  }
  
  // Render course details...
  return (
    <div>
      {/* Course content */}
    </div>
  );
};
```

### 3.6. ErrorDisplay Component

```tsx
// Frontend/app/components/Error/ErrorDisplay.tsx
import React from "react";
import Link from "next/link";
import { MdErrorOutline, MdRefresh, MdHome } from "react-icons/md";

interface ErrorDisplayProps {
  title: string;
  message: string;
  retryAction?: () => void;
  homeLink?: boolean;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  title,
  message,
  retryAction,
  homeLink = true,
}) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center">
      <div className="text-red-500 mb-4">
        <MdErrorOutline size={60} />
      </div>
      <h2 className="text-2xl font-bold mb-2 text-gray-800 dark:text-white">
        {title}
      </h2>
      <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-md">
        {message}
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        {retryAction && (
          <button
            onClick={retryAction}
            className="flex items-center justify-center gap-2 px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            <MdRefresh size={20} />
            Thử lại
          </button>
        )}
        {homeLink && (
          <Link href="/">
            <span className="flex items-center justify-center gap-2 px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
              <MdHome size={20} />
              Về trang chủ
            </span>
          </Link>
        )}
      </div>
    </div>
  );
};

export default ErrorDisplay;
```

## 4. Chiến Lược Logging

### 4.1. Backend Logging

```typescript
// Backend/utils/logger.ts
import winston from "winston";
import "winston-daily-rotate-file";

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  ),
  winston.format.errors({ stack: true })
);

// File transport for errors
const errorFileTransport = new winston.transports.DailyRotateFile({
  filename: "logs/error-%DATE%.log",
  datePattern: "YYYY-MM-DD",
  zippedArchive: true,
  maxSize: "20m",
  maxFiles: "14d",
  level: "error",
});

// File transport for all logs
const combinedFileTransport = new winston.transports.DailyRotateFile({
  filename: "logs/combined-%DATE%.log",
  datePattern: "YYYY-MM-DD",
  zippedArchive: true,
  maxSize: "20m",
  maxFiles: "14d",
});

// Console transport
const consoleTransport = new winston.transports.Console({
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.simple()
  ),
});

// Create logger
const logger = winston.createLogger({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  format: logFormat,
  transports: [
    errorFileTransport,
    combinedFileTransport,
    ...(process.env.NODE_ENV !== "production" ? [consoleTransport] : []),
  ],
});

export default logger;
```

### 4.2. Sử Dụng Logger

```typescript
// Import logger
import logger from "../utils/logger";

// Log error in middleware
export const ErrorMiddleware = (err: any, req: Request, res: Response, next: NextFunction) => {
  // Log error with context
  logger.error(`${err.statusCode} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`, {
    stack: err.stack,
    user: req.user ? req.user._id : "unauthenticated",
    body: req.body,
    params: req.params,
  });
  
  // Response handling...
};

// Log errors in controllers
export const getUserInfo = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Controller logic...
    } catch (error: any) {
      logger.error(`Error in getUserInfo: ${error.message}`, {
        userId: req.user?._id,
        error,
      });
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// Log application events
logger.info("Server started on port 8000");
logger.warn("Database connection slow");
logger.debug("Processing request", { requestId: "123", userId: "456" });
```

### 4.3. Frontend Logging

```typescript
// Frontend/app/utils/logger.ts
type LogLevel = "info" | "warn" | "error" | "debug";

interface LogData {
  message: string;
  level: LogLevel;
  timestamp: string;
  data?: any;
}

class Logger {
  private isDev: boolean;
  private logStorage: LogData[] = [];
  private maxLogSize: number = 100;
  
  constructor() {
    this.isDev = process.env.NODE_ENV !== "production";
  }
  
  private createLog(message: string, level: LogLevel, data?: any): LogData {
    return {
      message,
      level,
      timestamp: new Date().toISOString(),
      data,
    };
  }
  
  private storeLog(log: LogData): void {
    // Add log to storage
    this.logStorage.push(log);
    
    // Limit storage size
    if (this.logStorage.length > this.maxLogSize) {
      this.logStorage.shift();
    }
    
    // In development, also log to console
    if (this.isDev) {
      const consoleMethod = console[log.level] || console.log;
      if (log.data) {
        consoleMethod(`[${log.level.toUpperCase()}] ${log.message}`, log.data);
      } else {
        consoleMethod(`[${log.level.toUpperCase()}] ${log.message}`);
      }
    }
  }
  
  // Send logs to server
  public sendLogs(): void {
    if (this.logStorage.length === 0) return;
    
    // In a real app, you would send logs to your server
    // fetch('/api/logs', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ logs: this.logStorage })
    // });
    
    // Clear storage after sending
    this.logStorage = [];
  }
  
  public info(message: string, data?: any): void {
    const log = this.createLog(message, "info", data);
    this.storeLog(log);
  }
  
  public warn(message: string, data?: any): void {
    const log = this.createLog(message, "warn", data);
    this.storeLog(log);
  }
  
  public error(message: string, data?: any): void {
    const log = this.createLog(message, "error", data);
    this.storeLog(log);
    
    // Send logs immediately on error in production
    if (!this.isDev) {
      this.sendLogs();
    }
  }
  
  public debug(message: string, data?: any): void {
    // Only log debug in development
    if (this.isDev) {
      const log = this.createLog(message, "debug", data);
      this.storeLog(log);
    }
  }
}

// Create singleton instance
const logger = new Logger();

// Add window event listeners to send logs
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    logger.sendLogs();
  });
  
  // Send logs periodically
  setInterval(() => {
    logger.sendLogs();
  }, 60000); // Every minute
}

export default logger;
```

## 5. Xử Lý HTTP Status Codes

### 5.1. Status Codes Được Sử Dụng

| Status Code | Ý Nghĩa | Ví Dụ Sử Dụng |
|-------------|---------|---------------|
| 200 | OK | Lấy thông tin thành công |
| 201 | Created | Tạo tài nguyên mới thành công |
| 400 | Bad Request | Dữ liệu đầu vào không hợp lệ |
| 401 | Unauthorized | Chưa đăng nhập hoặc token hết hạn |
| 403 | Forbidden | Không đủ quyền truy cập |
| 404 | Not Found | Tài nguyên không tồn tại |
| 409 | Conflict | Xung đột dữ liệu (ví dụ: email đã tồn tại) |
| 422 | Unprocessable Entity | Dữ liệu hợp lệ nhưng không xử lý được |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Lỗi server không xác định |

### 5.2. Sử Dụng Status Codes

```typescript
// Ví dụ trong controller
export const getCourseById = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      
      // Validate ID format
      if (!mongoose.isValidObjectId(id)) {
        return next(new ErrorHandler("Invalid course ID format", 400));
      }
      
      const course = await CourseModel.findById(id);
      
      // Course not found
      if (!course) {
        return next(new ErrorHandler("Course not found", 404));
      }
      
      // Check access rights
      if (course.isPrivate && (!req.user || !course.authors.includes(req.user._id))) {
        return next(new ErrorHandler("You don't have access to this course", 403));
      }
      
      // Success
      res.status(200).json({
        success: true,
        course,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);
```

## 6. Xử Lý Lỗi Trong Những Tình Huống Đặc Biệt

### 6.1. Upload File

```typescript
// Backend/controller/course.controller.ts
export const uploadCourseVideo = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Check if file exists
      if (!req.file) {
        return next(new ErrorHandler("Please upload a video file", 400));
      }
      
      // Check file size
      const maxSize = 100 * 1024 * 1024; // 100MB
      if (req.file.size > maxSize) {
        return next(new ErrorHandler("Video size exceeds 100MB", 400));
      }
      
      // Check file type
      const allowedTypes = ["video/mp4", "video/webm"];
      if (!allowedTypes.includes(req.file.mimetype)) {
        return next(new ErrorHandler("Invalid file type. Please upload MP4 or WebM video", 400));
      }
      
      // Upload to Cloudinary
      try {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: "courses/videos",
          resource_type: "video",
        });
        
        // Clean up temporary file
        fs.unlinkSync(req.file.path);
        
        // Success
        res.status(200).json({
          success: true,
          video: {
            public_id: result.public_id,
            url: result.secure_url,
          },
        });
      } catch (cloudinaryError: any) {
        // Clean up temporary file if Cloudinary upload fails
        if (req.file.path && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        
        logger.error(`Cloudinary upload error: ${cloudinaryError.message}`, {
          error: cloudinaryError,
        });
        
        return next(new ErrorHandler("Video upload failed", 500));
      }
    } catch (error: any) {
      // Clean up temporary file if other error occurs
      if (req.file && req.file.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      
      return next(new ErrorHandler(error.message, 500));
    }
  }
);
```

### 6.2. Thanh Toán (Stripe)

```typescript
// Backend/controller/order.controller.ts
export const createPayment = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { courseId } = req.body;
      
      // Validation
      if (!courseId) {
        return next(new ErrorHandler("Course ID is required", 400));
      }
      
      const course = await CourseModel.findById(courseId);
      if (!course) {
        return next(new ErrorHandler("Course not found", 404));
      }
      
      // Create payment intent with Stripe
      try {
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(course.price * 100),
          currency: "usd",
          metadata: {
            courseId: course._id.toString(),
            userId: req.user?._id.toString(),
          },
        });
        
        res.status(200).json({
          success: true,
          clientSecret: paymentIntent.client_secret,
        });
      } catch (stripeError: any) {
        // Handle Stripe API errors
        logger.error(`Stripe error: ${stripeError.message}`, {
          error: stripeError,
          userId: req.user?._id,
          courseId,
        });
        
        // Map Stripe errors to appropriate responses
        if (stripeError.type === "StripeCardError") {
          return next(new ErrorHandler(`Payment error: ${stripeError.message}`, 400));
        } else if (stripeError.type === "StripeInvalidRequestError") {
          return next(new ErrorHandler("Invalid payment request", 400));
        } else {
          return next(new ErrorHandler("Payment processing error", 500));
        }
      }
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);
```

### 6.3. AI Tích Hợp

```typescript
// Backend/controller/ai.controller.ts
export const generateAIResponse = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { prompt } = req.body;
      
      // Validation
      if (!prompt) {
        return next(new ErrorHandler("Prompt is required", 400));
      }
      
      // Check prompt length
      if (prompt.length > 1000) {
        return next(new ErrorHandler("Prompt is too long (max 1000 characters)", 400));
      }
      
      // Call AI API with timeout
      try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
        const model = genAI.getGenerativeModel({ model: "gemini-1.0-pro-001" });
        
        // Set timeout for AI request
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error("AI request timeout")), 15000);
        });
        
        // Make AI request with timeout
        const result = await Promise.race([
          model.generateContent(prompt),
          timeoutPromise,
        ]);
        
        const response = result.response.text();
        
        res.status(200).json({
          success: true,
          response,
        });
      } catch (aiError: any) {
        logger.error(`AI API error: ${aiError.message}`, {
          error: aiError,
          prompt,
        });
        
        // Handle specific AI API errors
        if (aiError.message === "AI request timeout") {
          return next(new ErrorHandler("AI response timed out. Please try again.", 408));
        } else if (aiError.message.includes("rate limit")) {
          return next(new ErrorHandler("AI service rate limit exceeded. Please try again later.", 429));
        } else if (aiError.message.includes("content filtered")) {
          return next(new ErrorHandler("Your prompt contains inappropriate content.", 400));
        } else {
          return next(new ErrorHandler("Error generating AI response", 500));
        }
      }
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);
```

### 6.4. Socket.IO Error Handling

```typescript
// Backend/socketServer.ts
import { Server as SocketIOServer } from "socket.io";
import http from "http";
import logger from "./utils/logger";

export const initSocketServer = (server: http.Server) => {
  const io = new SocketIOServer(server, {
    cors: {
      origin: process.env.ORIGIN || "http://localhost:3000",
      credentials: true,
    },
  });
  
  // Error middleware
  io.use((socket, next) => {
    try {
      // Authentication check
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error("Authentication error"));
      }
      
      // Validate token (simplified)
      try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN || "");
        socket.data.user = decoded;
        next();
      } catch (err) {
        return next(new Error("Invalid token"));
      }
    } catch (error: any) {
      logger.error(`Socket middleware error: ${error.message}`, { error });
      next(new Error("Internal server error"));
    }
  });
  
  io.on("connection", (socket) => {
    logger.info(`User connected: ${socket.id}`, {
      userId: socket.data.user?.id,
    });
    
    // Handle events with error handling
    socket.on("notification", (data) => {
      try {
        // Validate data
        if (!data || !data.title || !data.message) {
          throw new Error("Invalid notification data");
        }
        
        // Broadcast notification
        io.emit("newNotification", data);
        
        logger.info(`Notification sent: ${data.title}`, {
          userId: socket.data.user?.id,
          notification: data,
        });
      } catch (error: any) {
        logger.error(`Socket notification error: ${error.message}`, {
          error,
          userId: socket.data.user?.id,
          data,
        });
        
        // Send error to client
        socket.emit("error", {
          message: "Failed to process notification",
        });
      }
    });
    
    // Handle disconnect
    socket.on("disconnect", () => {
      logger.info(`User disconnected: ${socket.id}`, {
        userId: socket.data.user?.id,
      });
    });
    
    // Handle errors
    socket.on("error", (error) => {
      logger.error(`Socket error: ${error.message}`, {
        error,
        userId: socket.data.user?.id,
      });
    });
  });
  
  // Server-wide error handling
  io.engine.on("connection_error", (err) => {
    logger.error(`Socket.IO connection error: ${err.message}`, { error: err });
  });
};
```

## 7. Rate Limiting và DOS Protection

```typescript
// Backend/middleware/rateLimit.ts
import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import Redis from "ioredis";
import ErrorHandler from "../utils/ErrorHandler";

// Create Redis client
const redisClient = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

// General API rate limiter (100 requests per 15 minutes)
export const apiLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args: string[]) => redisClient.call(...args),
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(new ErrorHandler("Too many requests, please try again later.", 429));
  },
});

// Login rate limiter (5 attempts per minute)
export const loginLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args: string[]) => redisClient.call(...args),
    prefix: "rl:login:",
  }),
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 attempts per minute
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(new ErrorHandler("Too many login attempts, please try again after 60 seconds.", 429));
  },
});

// Apply limiters in routes
// userRouter.post("/login", loginLimiter, loginUser);
// app.use(apiLimiter); // Apply to all routes
```

## 8. Best Practices

### 8.1. Error Handling Checklist

- [x] Sử dụng custom error handler
- [x] Bắt tất cả lỗi async với catchAsyncErrors hoặc try/catch
- [x] Phân loại và xử lý từng loại lỗi riêng biệt
- [x] Validate dữ liệu đầu vào
- [x] Ẩn thông tin nhạy cảm trong error message
- [x] Log lỗi một cách chi tiết
- [x] Hiển thị thông báo lỗi thân thiện với người dùng
- [x] Xử lý lỗi từ các dịch vụ bên thứ ba
- [x] Sử dụng status code HTTP phù hợp
- [x] Đảm bảo xử lý lỗi nhất quán trên toàn bộ ứng dụng

### 8.2. Security Considerations

1. **Không để lộ thông tin nhạy cảm**:
   - Stack trace chỉ hiển thị trong development
   - Không trả về thông tin database error chi tiết
   - Không để lộ thông tin server, phiên bản, cấu hình

2. **Validate input**:
   - Validate tất cả dữ liệu đầu vào
   - Sử dụng schema validation (Joi, Yup)
   - Sanitize input để tránh injection

3. **Rate limiting**:
   - Áp dụng rate limiting cho các API endpoints nhạy cảm
   - Ngăn chặn brute force attacks

4. **Auth errors**:
   - Không tiết lộ liệu email hay password sai
   - Đảm bảo thời gian xử lý không bị lộ thông qua timing attacks

### 8.3. Production vs Development

```typescript
// Different error handling based on environment
const errorResponse = {
  success: false,
  message: err.message,
};

// In development, include more details
if (process.env.NODE_ENV === "development") {
  errorResponse.stack = err.stack;
  errorResponse.error = err;
}

// In production, keep it minimal
res.status(err.statusCode).json(errorResponse);
```

### 8.4. User-Friendly Error Messages

```typescript
// Map technical errors to user-friendly messages
const getUserFriendlyMessage = (error: any): string => {
  // Database connection errors
  if (error.name === "MongoNetworkError") {
    return "Không thể kết nối đến cơ sở dữ liệu. Vui lòng thử lại sau.";
  }
  
  // JWT errors
  if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
    return "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.";
  }
  
  // Validation errors
  if (error.name === "ValidationError") {
    return "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin.";
  }
  
  // Default message
  return error.message || "Đã xảy ra lỗi. Vui lòng thử lại sau.";
};

// Use in error middleware
res.status(err.statusCode).json({
  success: false,
  message: getUserFriendlyMessage(err),
});
```

## 9. Testing Error Handling

### 9.1. Unit Testing

```typescript
// Backend/tests/unit/errorHandler.test.ts
import { Request, Response } from "express";
import { ErrorMiddleware } from "../../middleware/error";
import ErrorHandler from "../../utils/ErrorHandler";

describe("Error Middleware", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: jest.Mock;
  
  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    nextFunction = jest.fn();
  });
  
  test("handles custom error", () => {
    const errorMessage = "Test error message";
    const errorCode = 400;
    const error = new ErrorHandler(errorMessage, errorCode);
    
    ErrorMiddleware(error, mockRequest as Request, mockResponse as Response, nextFunction);
    
    expect(mockResponse.status).toHaveBeenCalledWith(errorCode);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: errorMessage,
      })
    );
  });
  
  test("handles MongoDB validation error", () => {
    const error = {
      name: "ValidationError",
      errors: {
        email: { message: "Email is required" },
        password: { message: "Password is required" },
      },
    };
    
    ErrorMiddleware(error, mockRequest as Request, mockResponse as Response, nextFunction);
    
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: expect.stringContaining("Email is required"),
      })
    );
  });
  
  // More tests for other error types...
});
```

### 9.2. Integration Testing

```typescript
// Backend/tests/integration/error.test.ts
import request from "supertest";
import app from "../../app";
import mongoose from "mongoose";
import userModel from "../../models/user.model";

describe("Error handling integration tests", () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.TEST_DB_URL || "");
  });
  
  afterAll(async () => {
    await mongoose.connection.close();
  });
  
  describe("404 Not Found", () => {
    it("should return 404 for non-existent route", async () => {
      const response = await request(app).get("/api/v1/non-existent-route");
      
      expect(response.status).toBe(404);
      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining("not found"),
      });
    });
    
    it("should return 404 for non-existent user", async () => {
      const response = await request(app).get("/api/v1/user/non-existent-id");
      
      expect(response.status).toBe(404);
      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining("not found"),
      });
    });
  });
  
  describe("Validation errors", () => {
    it("should return 400 for invalid user registration data", async () => {
      const response = await request(app)
        .post("/api/v1/registration")
        .send({
          name: "Test",
          email: "invalid-email",
          password: "123", // Too short
        });
      
      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining("valid email"),
      });
    });
  });
  
  describe("Auth errors", () => {
    it("should return 401 for protected route without token", async () => {
      const response = await request(app).get("/api/v1/me");
      
      expect(response.status).toBe(401);
      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining("login"),
      });
    });
  });
  
  // More integration tests...
});
```

## 10. Kết Luận

Hệ thống xử lý lỗi trong dự án E-Learning được thiết kế để:

1. **Nhất quán**: Sử dụng cùng một mô hình xử lý lỗi trên toàn bộ dự án
2. **Bảo mật**: Không để lộ thông tin nhạy cảm
3. **Dễ sử dụng**: Cung cấp thông báo lỗi thân thiện với người dùng
4. **Dễ debug**: Log lỗi chi tiết cho developers
5. **Linh hoạt**: Xử lý các loại lỗi khác nhau một cách phù hợp

Các best practices được áp dụng đảm bảo hệ thống có khả năng phục hồi tốt và người dùng có trải nghiệm mượt mà ngay cả khi có lỗi xảy ra.