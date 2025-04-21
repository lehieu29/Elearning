# Biện Pháp Bảo Mật Trong Dự Án E-Learning

Dự án E-Learning có một loạt các biện pháp bảo mật toàn diện để bảo vệ dữ liệu người dùng, nội dung khóa học và đảm bảo tính toàn vẹn của hệ thống. Tài liệu này mô tả chi tiết về các biện pháp bảo mật được áp dụng trong dự án.

## 1. Xác Thực & Ủy Quyền (Authentication & Authorization)

### 1.1. Xác Thực Người Dùng

#### JWT (JSON Web Tokens)

```typescript
// Backend/models/user.model.ts
userSchema.methods.SignAccessToken = function () {
  return jwt.sign({ id: this._id }, process.env.ACCESS_TOKEN || "", {
    expiresIn: "5m",
  });
};

userSchema.methods.SignRefreshToken = function () {
  return jwt.sign({ id: this._id }, process.env.REFRESH_TOKEN || "", {
    expiresIn: "3d",
  });
};
```

#### Token Management

```typescript
// Backend/controller/user.controller.ts
export const loginUser = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;
      
      // Validation
      if (!email || !password) {
        return next(new ErrorHandler("Please enter email and password", 400));
      }
      
      // Find user
      const user = await userModel.findOne({ email }).select("+password");
      if (!user) {
        return next(new ErrorHandler("Invalid email or password", 401));
      }
      
      // Check password
      const isPasswordMatch = await user.comparePassword(password);
      if (!isPasswordMatch) {
        return next(new ErrorHandler("Invalid email or password", 401));
      }
      
      // Generate tokens
      const accessToken = user.SignAccessToken();
      const refreshToken = user.SignRefreshToken();
      
      // Set cookies
      res.cookie("access_token", accessToken, {
        maxAge: 5 * 60 * 1000, // 5 minutes
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      });
      
      res.cookie("refresh_token", refreshToken, {
        maxAge: 3 * 24 * 60 * 60 * 1000, // 3 days
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      });
      
      // Return response
      res.status(200).json({
        success: true,
        accessToken,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified,
          avatar: user.avatar,
        },
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);
```

#### Refresh Token Mechanism

```typescript
// Backend/controller/user.controller.ts
export const updateAccessToken = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const refresh_token = req.cookies.refresh_token;
      
      if (!refresh_token) {
        return next(new ErrorHandler("Please login to access this resource", 401));
      }
      
      // Verify refresh token
      const decoded = jwt.verify(
        refresh_token,
        process.env.REFRESH_TOKEN as string
      ) as JwtPayload;
      
      if (!decoded) {
        return next(new ErrorHandler("Invalid refresh token", 401));
      }
      
      // Find user
      const user = await userModel.findById(decoded.id);
      if (!user) {
        return next(new ErrorHandler("User not found", 404));
      }
      
      // Generate new tokens
      const accessToken = user.SignAccessToken();
      const refreshToken = user.SignRefreshToken();
      
      // Update cookies
      res.cookie("access_token", accessToken, {
        maxAge: 5 * 60 * 1000, // 5 minutes
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      });
      
      res.cookie("refresh_token", refreshToken, {
        maxAge: 3 * 24 * 60 * 60 * 1000, // 3 days
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      });
      
      // Return response
      res.status(200).json({
        success: true,
        accessToken,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);
```

### 1.2. Authorization (Role-Based Access Control)

```typescript
// Backend/middleware/auth.ts
import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import ErrorHandler from "../utils/ErrorHandler";
import asyncHandler from "./catchAsyncErrors";
import userModel from "../models/user.model";

// Authentication Middleware
export const isAuthenticated = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const access_token = req.cookies.access_token;
    
    if (!access_token) {
      return next(new ErrorHandler("Please login to access this resource", 401));
    }
    
    // Verify token
    try {
      const decoded = jwt.verify(
        access_token,
        process.env.ACCESS_TOKEN as string
      ) as JwtPayload;
      
      if (!decoded) {
        return next(new ErrorHandler("Access token is not valid", 401));
      }
      
      // Find user
      const user = await userModel.findById(decoded.id);
      if (!user) {
        return next(new ErrorHandler("User not found", 404));
      }
      
      // Add user to request
      req.user = user;
      next();
    } catch (error: any) {
      if (error.name === "TokenExpiredError") {
        return next(new ErrorHandler("Access token has expired", 401));
      }
      
      return next(new ErrorHandler("Authentication failed", 401));
    }
  }
);

// Authorization Middleware
export const authorizeRoles = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!roles.includes(req.user?.role || "")) {
      return next(
        new ErrorHandler(
          `Role (${req.user?.role}) is not allowed to access this resource`,
          403
        )
      );
    }
    next();
  };
};
```

### 1.3. Social Authentication

```typescript
// Backend/controller/user.controller.ts
export const socialAuth = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, name, avatar } = req.body;
      
      // Find or create user
      const user = await userModel.findOne({ email });
      
      if (user) {
        // Generate tokens for existing user
        const accessToken = user.SignAccessToken();
        const refreshToken = user.SignRefreshToken();
        
        // Set cookies
        res.cookie("access_token", accessToken, {
          maxAge: 5 * 60 * 1000, // 5 minutes
          httpOnly: true,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
        });
        
        res.cookie("refresh_token", refreshToken, {
          maxAge: 3 * 24 * 60 * 60 * 1000, // 3 days
          httpOnly: true,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
        });
        
        // Return response
        return res.status(200).json({
          success: true,
          accessToken,
          user,
        });
      } else {
        // Create new user
        const newUser = await userModel.create({
          name,
          email,
          avatar: {
            public_id: Date.now().toString(),
            url: avatar,
          },
          password: Math.random().toString(36).slice(2, 10),
          isVerified: true,
        });
        
        // Generate tokens for new user
        const accessToken = newUser.SignAccessToken();
        const refreshToken = newUser.SignRefreshToken();
        
        // Set cookies
        res.cookie("access_token", accessToken, {
          maxAge: 5 * 60 * 1000, // 5 minutes
          httpOnly: true,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
        });
        
        res.cookie("refresh_token", refreshToken, {
          maxAge: 3 * 24 * 60 * 60 * 1000, // 3 days
          httpOnly: true,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
        });
        
        // Return response
        return res.status(200).json({
          success: true,
          accessToken,
          user: newUser,
        });
      }
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);
```

### 1.4. NextAuth Integration (Frontend)

```typescript
// Frontend/pages/api/auth/[...nextauth].ts
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GithubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import { API } from "@/redux/features/api/apiSlice";

export default NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID || "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          const { data } = await API.post("/auth/login", {
            email: credentials?.email,
            password: credentials?.password,
          });
          
          if (data?.user) {
            return data.user;
          }
          return null;
        } catch (error) {
          throw new Error("Invalid email or password");
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.accessToken = user.accessToken;
        token.user = user;
      }
      
      if (account && account.type === "oauth") {
        // Handle social login
      }
      
      return token;
    },
    async session({ session, token }) {
      session.user = token.user;
      session.accessToken = token.accessToken;
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
});
```

## 2. Bảo Mật Mật Khẩu

### 2.1. Password Hashing

```typescript
// Backend/models/user.model.ts
import bcrypt from "bcryptjs";

userSchema.pre<IUser>("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }
  // Hash password before saving to DB
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password
userSchema.methods.comparePassword = async function (
  enteredPassword: string
): Promise<boolean> {
  return await bcrypt.compare(enteredPassword, this.password);
};
```

### 2.2. Password Reset Flow

```typescript
// Backend/controller/user.controller.ts
export const forgotPassword = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return next(new ErrorHandler("Please enter your email", 400));
      }
      
      // Find user
      const user = await userModel.findOne({ email });
      if (!user) {
        return next(new ErrorHandler("User not found with this email", 404));
      }
      
      // Generate reset token
      const resetToken = crypto.randomBytes(20).toString("hex");
      
      // Add reset token to user
      user.resetPasswordToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");
      user.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 minutes
      
      await user.save({ validateBeforeSave: false });
      
      // Generate reset URL
      const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
      
      // Send reset email
      await sendMail({
        email: user.email,
        subject: "Password Reset Request",
        template: "password-reset.ejs",
        data: {
          name: user.name,
          resetUrl,
        },
      });
      
      res.status(200).json({
        success: true,
        message: `Password reset email sent to ${user.email}`,
      });
    } catch (error: any) {
      // Reset user fields on error
      if (error.user) {
        error.user.resetPasswordToken = undefined;
        error.user.resetPasswordExpire = undefined;
        await error.user.save({ validateBeforeSave: false });
      }
      
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const resetPassword = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token } = req.params;
      const { password, confirmPassword } = req.body;
      
      // Validate passwords
      if (password !== confirmPassword) {
        return next(new ErrorHandler("Passwords do not match", 400));
      }
      
      // Hash token
      const resetPasswordToken = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");
      
      // Find user with valid token
      const user = await userModel.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() },
      });
      
      if (!user) {
        return next(new ErrorHandler("Invalid or expired reset token", 400));
      }
      
      // Update password
      user.password = password;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      
      await user.save();
      
      res.status(200).json({
        success: true,
        message: "Password reset successfully",
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);
```

### 2.3. Password Policy

```typescript
// Backend/utils/validator.ts
// Password validation rules
export const validatePassword = (password: string): boolean => {
  // At least 8 characters
  if (password.length < 8) {
    return false;
  }
  
  // At least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    return false;
  }
  
  // At least one lowercase letter
  if (!/[a-z]/.test(password)) {
    return false;
  }
  
  // At least one number
  if (!/[0-9]/.test(password)) {
    return false;
  }
  
  // At least one special character
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return false;
  }
  
  return true;
};

// Frontend/app/components/Auth/SignUp.tsx
// Password validation schema
const validationSchema = Yup.object({
  name: Yup.string().required("Name is required"),
  email: Yup.string().email("Invalid email").required("Email is required"),
  password: Yup.string()
    .min(8, "Password must be at least 8 characters")
    .matches(/[A-Z]/, "Password must contain at least one uppercase letter")
    .matches(/[a-z]/, "Password must contain at least one lowercase letter")
    .matches(/[0-9]/, "Password must contain at least one number")
    .matches(
      /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
      "Password must contain at least one special character"
    )
    .required("Password is required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password"), undefined], "Passwords must match")
    .required("Confirm password is required"),
});
```

## 3. HTTPS & Bảo Mật Giao Tiếp

### 3.1. SSL/TLS Configuration

```javascript
// Backend/server.ts
import fs from "fs";
import https from "https";
import app from "./app";

// For development with self-signed certificates
if (process.env.NODE_ENV === "development" && process.env.ENABLE_HTTPS === "true") {
  const options = {
    key: fs.readFileSync("./certificates/key.pem"),
    cert: fs.readFileSync("./certificates/cert.pem"),
  };
  
  https.createServer(options, app).listen(process.env.PORT, () => {
    console.log(`Server running on https://localhost:${process.env.PORT}`);
  });
} else {
  // For production, HTTPS is handled by reverse proxy (e.g., Nginx)
  app.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`);
  });
}
```

### 3.2. HTTP Headers Security

```typescript
// Backend/app.ts
import helmet from "helmet";

// Use Helmet for security headers
app.use(helmet());

// Or configure specific headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "https://js.stripe.com", "https://cdn.jsdelivr.net"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
        connectSrc: ["'self'", process.env.FRONTEND_URL, "https://api.stripe.com"],
        frameSrc: ["'self'", "https://js.stripe.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
      },
    },
    xssFilter: true,
    noSniff: true,
    referrerPolicy: { policy: "same-origin" },
  })
);

// Set CORS options
app.use(
  cors({
    origin: process.env.ORIGIN?.split(",") || ["http://localhost:3000"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
```

### 3.3. CORS Configuration

```typescript
// Backend/app.ts
import cors from "cors";

// Configure CORS
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl requests)
      if (!origin) return callback(null, true);
      
      const allowedOrigins = (process.env.ORIGIN || "").split(",");
      
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("CORS policy violation"), false);
      }
    },
    credentials: true,
    maxAge: 86400, // Cache preflight request for 24h
  })
);
```

### 3.4. Content Security Policy

```typescript
// Frontend/app/layout.tsx
export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "https://yourdomain.com"),
  title: "E-Learning Platform",
  description: "Online learning platform with AI integration",
};

// CSP headers using Next.js config
export const headers = () => {
  return [
    {
      key: "Content-Security-Policy",
      value: `
        default-src 'self';
        script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://cdn.jsdelivr.net;
        style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
        img-src 'self' data: https://res.cloudinary.com;
        font-src 'self' https://fonts.gstatic.com;
        connect-src 'self' ${process.env.NEXT_PUBLIC_SERVER_URI} https://api.stripe.com;
        frame-src 'self' https://js.stripe.com;
        object-src 'none';
      `.replace(/\s{2,}/g, " ").trim(),
    },
  ];
};
```

## 4. Protection Chống Lại Các Cuộc Tấn Công Phổ Biến

### 4.1. Cross-Site Scripting (XSS) Protection

```typescript
// Backend/app.ts
import xss from "xss-clean";

// Use XSS-Clean to sanitize user input
app.use(xss());

// Custom sanitization middleware
const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  // Sanitize req.body
  if (req.body) {
    Object.keys(req.body).forEach((key) => {
      if (typeof req.body[key] === "string") {
        req.body[key] = req.body[key].replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
      }
    });
  }
  
  // Sanitize req.query
  if (req.query) {
    Object.keys(req.query).forEach((key) => {
      if (typeof req.query[key] === "string") {
        req.query[key] = req.query[key].replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
      }
    });
  }
  
  next();
};

app.use(sanitizeInput);
```

### 4.2. Cross-Site Request Forgery (CSRF) Protection

```typescript
// Backend/app.ts
import csurf from "csurf";

// Configure CSRF protection
const csrfProtection = csurf({
  cookie: {
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
  },
});

// Apply to all routes that require CSRF protection
app.use("/api/v1/user", csrfProtection);
app.use("/api/v1/course", csrfProtection);
app.use("/api/v1/order", csrfProtection);

// Generate CSRF token
app.get("/api/v1/csrf-token", (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// Frontend CSRF token handling
// Frontend/app/utils/api.ts
import axios from "axios";

// Get CSRF token
export const getCsrfToken = async () => {
  const { data } = await axios.get(`${process.env.NEXT_PUBLIC_SERVER_URI}/csrf-token`, {
    withCredentials: true,
  });
  return data.csrfToken;
};

// Add CSRF token to requests
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_SERVER_URI,
  withCredentials: true,
});

api.interceptors.request.use(async (config) => {
  // Skip for CSRF token request
  if (config.url?.includes("csrf-token")) {
    return config;
  }
  
  // Add CSRF token to headers
  try {
    const token = await getCsrfToken();
    config.headers["X-CSRF-Token"] = token;
  } catch (error) {
    console.error("Failed to fetch CSRF token:", error);
  }
  
  return config;
});
```

### 4.3. SQL Injection Và NoSQL Injection Protection

```typescript
// Backend/utils/sanitize.ts
import { isValidObjectId } from "mongoose";

// Sanitize MongoDB query
export const sanitizeMongoQuery = (query: any): any => {
  const sanitizedQuery = { ...query };
  
  // Remove potential operators from queries
  const blacklist = ["$ne", "$gt", "$gte", "$lt", "$lte", "$in", "$nin", "$or", "$and", "$not", "$nor", "$where", "$expr"];
  
  const sanitizeObj = (obj: any) => {
    if (typeof obj !== "object" || obj === null) {
      return obj;
    }
    
    const sanitized: any = Array.isArray(obj) ? [] : {};
    
    for (const key in obj) {
      // Remove MongoDB operators
      if (blacklist.includes(key)) {
        continue;
      }
      
      // Validate ObjectId
      if (key === "_id" && !isValidObjectId(obj[key])) {
        continue;
      }
      
      // Recursively sanitize nested objects
      sanitized[key] = sanitizeObj(obj[key]);
    }
    
    return sanitized;
  };
  
  return sanitizeObj(sanitizedQuery);
};

// Usage in controllers
// Backend/controller/course.controller.ts
export const getCourses = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Sanitize query parameters
      const sanitizedQuery = sanitizeMongoQuery(req.query);
      
      // Use sanitized query for database operations
      const courses = await CourseModel.find(sanitizedQuery);
      
      res.status(200).json({
        success: true,
        courses,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);
```

### 4.4. Rate Limiting

```typescript
// Backend/middleware/rateLimit.ts
import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import Redis from "ioredis";

// Initialize Redis client
const redisClient = new Redis(process.env.REDIS_URL || "");

// Configure rate limiters
export const apiLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args: string[]) => redisClient.call(...args),
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: { success: false, message: "Too many requests, please try again later." },
});

// Login specific limiter
export const loginLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args: string[]) => redisClient.call(...args),
    prefix: "rl:login:",
  }),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 login attempts per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many login attempts, please try again later." },
});

// Apply limiters to routes
// Backend/routes/user.route.ts
import { apiLimiter, loginLimiter } from "../middleware/rateLimit";

userRouter.post("/login", loginLimiter, loginUser);
userRouter.post("/registration", apiLimiter, registrationUser);
```

### 4.5. Brute Force Protection

```typescript
// Backend/middleware/bruteForce.ts
import ExpressBrute from "express-brute";
import RedisStore from "express-brute-redis";
import Redis from "ioredis";
import { Request, Response, NextFunction } from "express";
import ErrorHandler from "../utils/ErrorHandler";

// Initialize Redis client
const redisClient = new Redis(process.env.REDIS_URL || "");

// Configure Brute Force Protection
const store = new RedisStore({
  client: redisClient,
  prefix: "bf:",
});

// Global Brute Force Protection
export const globalBruteforce = new ExpressBrute(store, {
  freeRetries: 1000, // Allow 1000 requests per day
  attachResetToRequest: false,
  refreshTimeoutOnRequest: false,
  minWait: 25 * 60 * 60 * 1000, // 25 hours
  maxWait: 25 * 60 * 60 * 1000, // 25 hours
  lifetime: 24 * 60 * 60, // 1 day in seconds
  failCallback: (req: Request, res: Response, next: NextFunction, nextValidRequestDate: Date) => {
    next(new ErrorHandler(`Too many requests, please try again after ${nextValidRequestDate.toLocaleString()}`, 429));
  },
});

// Account Brute Force Protection
export const accountBruteforce = new ExpressBrute(store, {
  freeRetries: 5, // Allow 5 login attempts
  minWait: 5 * 60 * 1000, // 5 minutes
  maxWait: 60 * 60 * 1000, // 1 hour
  failCallback: (req: Request, res: Response, next: NextFunction, nextValidRequestDate: Date) => {
    next(new ErrorHandler(`Account locked due to too many login attempts. Try again after ${nextValidRequestDate.toLocaleString()}`, 429));
  },
});

// Usage in routes
// Backend/routes/user.route.ts
import { accountBruteforce } from "../middleware/bruteForce";

userRouter.post(
  "/login",
  (req, res, next) => {
    // Use email as key to prevent attacks on multiple accounts
    accountBruteforce.getMiddleware({
      key: (req, res, next) => {
        next(req.body.email);
      },
    })(req, res, next);
  },
  loginUser
);
```

## 5. Data Encryption

### 5.1. Database Encryption

```typescript
// Backend/models/user.model.ts
import crypto from "crypto";

// Function to encrypt sensitive data
const encrypt = (text: string): { iv: string; encryptedData: string } => {
  const algorithm = "aes-256-cbc";
  const key = Buffer.from(process.env.ENCRYPTION_KEY || "", "hex");
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  
  return {
    iv: iv.toString("hex"),
    encryptedData: encrypted,
  };
};

// Function to decrypt sensitive data
const decrypt = (encryptedData: string, iv: string): string => {
  const algorithm = "aes-256-cbc";
  const key = Buffer.from(process.env.ENCRYPTION_KEY || "", "hex");
  const decipher = crypto.createDecipheriv(
    algorithm,
    key,
    Buffer.from(iv, "hex")
  );
  
  let decrypted = decipher.update(encryptedData, "hex", "utf8");
  decrypted += decipher.final("utf8");
  
  return decrypted;
};

// Example schema with encrypted fields
const sensitiveDataSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  // Stored as encrypted
  cardNumber: {
    iv: String,
    encryptedData: String,
  },
  // Getter/Setter for encryption/decryption
  billingAddress: {
    type: {
      iv: String,
      encryptedData: String,
    },
    get: function(this: any) {
      if (this._billingAddress?.iv && this._billingAddress?.encryptedData) {
        return decrypt(this._billingAddress.encryptedData, this._billingAddress.iv);
      }
      return "";
    },
    set: function(value: string) {
      if (value) {
        this._billingAddress = encrypt(value);
      }
      return this._billingAddress;
    },
  },
});
```

### 5.2. Secure Communication

```typescript
// Backend/routes/order.route.ts
// Example of data encryption for sensitive payment data
export const createPayment = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { courseId, paymentMethodId } = req.body;
      
      // Generate one-time encryption key
      const encryptionKey = crypto.randomBytes(32).toString("hex");
      
      // Save encryption key in session or Redis
      req.session.encryptionKey = encryptionKey;
      
      // Encrypt client secret before sending
      const clientSecret = await stripe.paymentIntents.create({
        amount: 1000,
        currency: "usd",
        payment_method_types: ["card"],
      }).client_secret;
      
      // Encrypt the client secret
      const encryptedSecret = encryptWithKey(clientSecret, encryptionKey);
      
      res.status(200).json({
        success: true,
        encryptedSecret,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// Utility to encrypt with a specific key
function encryptWithKey(text: string, key: string): string {
  const algorithm = "aes-256-cbc";
  const keyBuffer = Buffer.from(key, "hex");
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipheriv(algorithm, keyBuffer, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  
  return JSON.stringify({
    iv: iv.toString("hex"),
    data: encrypted,
  });
}
```

## 6. File Upload Security

### 6.1. Secure File Upload

```typescript
// Backend/middleware/upload.ts
import multer from "multer";
import path from "path";
import { Request } from "express";
import ErrorHandler from "../utils/ErrorHandler";
import sanitize from "sanitize-filename";

// Configure storage
const storage = multer.diskStorage({
  destination: function (req: Request, file: Express.Multer.File, cb) {
    cb(null, "uploads/");
  },
  filename: function (req: Request, file: Express.Multer.File, cb) {
    // Sanitize filename
    const sanitizedName = sanitize(file.originalname);
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      path.parse(sanitizedName).name + "-" + uniqueSuffix + path.extname(sanitizedName)
    );
  },
});

// File filter
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Define allowed file types
  const allowedTypes = {
    "image/jpeg": true,
    "image/png": true,
    "image/gif": true,
    "application/pdf": true,
    "video/mp4": true,
    "video/webm": true,
  };
  
  if (allowedTypes[file.mimetype]) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only JPEG, PNG, GIF, PDF, MP4, and WebM are allowed."));
  }
};

// Size limits
const imageUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

const videoUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
});

// Export upload middleware
export { imageUpload, videoUpload };
```

### 6.2. File Scanning

```typescript
// Backend/utils/fileScan.ts
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import mime from "mime-types";

// Basic file validation
export const validateFile = async (filePath: string): Promise<boolean> => {
  try {
    // Check file exists
    await fs.access(filePath);
    
    // Read first few bytes for magic number check
    const buffer = Buffer.alloc(4100);
    const fileHandle = await fs.open(filePath, "r");
    await fileHandle.read(buffer, 0, 4100, 0);
    await fileHandle.close();
    
    // Check file signature (magic numbers)
    const signature = buffer.toString("hex", 0, 20);
    
    // JPEG: starts with ffd8ff
    // PNG: starts with 89504e47
    // PDF: starts with 25504446
    // MP4: has ftyp at bytes 4-7
    
    const mimeType = mime.lookup(filePath);
    
    if (mimeType === "image/jpeg" && !signature.startsWith("ffd8ff")) {
      return false;
    }
    
    if (mimeType === "image/png" && !signature.startsWith("89504e47")) {
      return false;
    }
    
    if (mimeType === "application/pdf" && !signature.startsWith("25504446")) {
      return false;
    }
    
    if (mimeType === "video/mp4" && buffer.toString("ascii", 4, 8) !== "ftyp") {
      return false;
    }
    
    // File passed validation
    return true;
  } catch (error) {
    return false;
  }
};

// Implementation in controller
// Backend/controller/course.controller.ts
export const uploadCourseImage = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        return next(new ErrorHandler("Please upload an image", 400));
      }
      
      // Validate file
      const isValidFile = await validateFile(req.file.path);
      if (!isValidFile) {
        // Delete the invalid file
        await fs.unlink(req.file.path);
        return next(new ErrorHandler("Invalid file format", 400));
      }
      
      // Process file upload
      // ...
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);
```

## 7. Logging & Monitoring

### 7.1. Security Logging

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

// Security log file transport
const securityTransport = new winston.transports.DailyRotateFile({
  filename: "logs/security-%DATE%.log",
  datePattern: "YYYY-MM-DD",
  zippedArchive: true,
  maxSize: "20m",
  maxFiles: "14d",
});

// Create security logger
const securityLogger = winston.createLogger({
  level: "info",
  format: logFormat,
  transports: [
    securityTransport,
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
});

// Authentication logging
export const logAuthEvent = (type: string, user: string, success: boolean, ip: string, userAgent: string) => {
  const event = {
    type,
    user,
    success,
    ip,
    userAgent,
    timestamp: new Date().toISOString(),
  };
  
  securityLogger.info(JSON.stringify(event));
};

// Usage in controller
// Backend/controller/user.controller.ts
export const loginUser = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;
      
      // Find user
      const user = await userModel.findOne({ email }).select("+password");
      
      // Log authentication attempt
      logAuthEvent(
        "login",
        email,
        !!user,
        req.ip,
        req.headers["user-agent"] || ""
      );
      
      if (!user) {
        return next(new ErrorHandler("Invalid email or password", 401));
      }
      
      // Check password
      const isPasswordMatch = await user.comparePassword(password);
      
      // Log authentication result
      logAuthEvent(
        "login",
        email,
        isPasswordMatch,
        req.ip,
        req.headers["user-agent"] || ""
      );
      
      if (!isPasswordMatch) {
        return next(new ErrorHandler("Invalid email or password", 401));
      }
      
      // Handle successful login
      // ...
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);
```

### 7.2. Intrusion Detection

```typescript
// Backend/middleware/intrusionDetection.ts
import { Request, Response, NextFunction } from "express";
import ErrorHandler from "../utils/ErrorHandler";
import { securityLogger } from "../utils/logger";

// SQL Injection detection patterns
const sqlInjectionPattern = /(\b(select|insert|update|delete|drop|alter|create|where)\b.*\b(from|into|table)\b)|(\b(union|and|or)\b.*\b(select)\b)|('.*--)/i;

// XSS detection patterns
const xssPattern = /((\%3C)|<)((\%2F)|\/)*[a-z0-9\%]+((\%3E)|>)/i;

// LFI/RFI detection patterns
const lfiRfiPattern = /\.\.\//;

// Intrusion detection middleware
export const detectIntrusion = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check request method
    if (["POST", "PUT", "PATCH"].includes(req.method)) {
      // Check request body
      if (req.body) {
        checkObject(req.body);
      }
    }
    
    // Check query parameters
    if (req.query) {
      checkObject(req.query);
    }
    
    // Check URL
    if (req.path) {
      checkString(req.path);
    }
    
    // If no intrusion detected, proceed
    next();
  } catch (error: any) {
    // Log security incident
    securityLogger.warn(`Potential intrusion detected: ${error.message}`, {
      ip: req.ip,
      method: req.method,
      path: req.path,
      query: req.query,
      body: req.body,
      userAgent: req.headers["user-agent"],
    });
    
    return next(new ErrorHandler("Invalid request", 400));
  }
};

// Helper function to check objects recursively
function checkObject(obj: any) {
  if (!obj) return;
  
  if (Array.isArray(obj)) {
    obj.forEach((item) => {
      if (typeof item === "object") {
        checkObject(item);
      } else if (typeof item === "string") {
        checkString(item);
      }
    });
  } else {
    Object.keys(obj).forEach((key) => {
      const value = obj[key];
      
      if (typeof value === "object") {
        checkObject(value);
      } else if (typeof value === "string") {
        checkString(value);
      }
    });
  }
}

// Helper function to check strings for attack patterns
function checkString(str: string) {
  if (sqlInjectionPattern.test(str)) {
    throw new Error(`SQL Injection attempt detected: ${str}`);
  }
  
  if (xssPattern.test(str)) {
    throw new Error(`XSS attempt detected: ${str}`);
  }
  
  if (lfiRfiPattern.test(str)) {
    throw new Error(`LFI/RFI attempt detected: ${str}`);
  }
}

// Apply middleware
// Backend/app.ts
import { detectIntrusion } from "./middleware/intrusionDetection";

app.use(detectIntrusion);
```

## 8. API Security

### 8.1. API Key Authentication

```typescript
// Backend/middleware/apiKey.ts
import { Request, Response, NextFunction } from "express";
import ErrorHandler from "../utils/ErrorHandler";
import crypto from "crypto";

// API Key middleware for 3rd party integrations
export const apiKeyAuth = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers["x-api-key"];
  
  if (!apiKey) {
    return next(new ErrorHandler("API key is required", 401));
  }
  
  // Compare API key
  const validApiKey = process.env.API_KEY;
  
  // Use timing-safe comparison to prevent timing attacks
  if (!crypto.timingSafeEqual(
    Buffer.from(apiKey as string),
    Buffer.from(validApiKey || "")
  )) {
    return next(new ErrorHandler("Invalid API key", 401));
  }
  
  next();
};

// Usage in routes
// Backend/routes/api.route.ts
import { apiKeyAuth } from "../middleware/apiKey";

apiRouter.use(apiKeyAuth);
apiRouter.get("/data", getApiData);
```

### 8.2. API Request Validation

```typescript
// Backend/middleware/validate.ts
import { Request, Response, NextFunction } from "express";
import Joi from "joi";
import ErrorHandler from "../utils/ErrorHandler";

// Validation middleware factory
export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });
    
    if (error) {
      const errorMessage = error.details
        .map((detail) => detail.message)
        .join(", ");
      
      return next(new ErrorHandler(errorMessage, 400));
    }
    
    next();
  };
};

// Example usage
// Backend/routes/user.route.ts
import { validate } from "../middleware/validate";
import Joi from "joi";

// Define validation schema
const userSchema = Joi.object({
  name: Joi.string().min(3).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
});

// Apply validation middleware
userRouter.post("/registration", validate(userSchema), registrationUser);
```

### 8.3. API Version Control

```typescript
// Backend/routes/index.ts
import express from "express";
import userRouterV1 from "./v1/user.route";
import courseRouterV1 from "./v1/course.route";
import userRouterV2 from "./v2/user.route";
import courseRouterV2 from "./v2/course.route";

const router = express.Router();

// API v1 routes
router.use("/v1/user", userRouterV1);
router.use("/v1/course", courseRouterV1);

// API v2 routes
router.use("/v2/user", userRouterV2);
router.use("/v2/course", courseRouterV2);

export default router;
```

## 9. Compliance & Privacy

### 9.1. GDPR Compliance

```typescript
// Backend/utils/gdpr.ts
import { Request, Response, NextFunction } from "express";
import userModel from "../models/user.model";
import ErrorHandler from "../utils/ErrorHandler";
import mongoose from "mongoose";
import fs from "fs-extra";
import archiver from "archiver";

// Get all user data for GDPR data portability
export const getUserData = async (userId: string): Promise<any> => {
  // Get user information
  const user = await userModel.findById(userId);
  
  if (!user) {
    throw new Error("User not found");
  }
  
  // Get related data
  const userData = {
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
    courses: await mongoose.model("Course").find({ "user._id": userId }),
    orders: await mongoose.model("Order").find({ userId }),
    reviews: await mongoose.model("Course").find({ "reviews.user._id": userId }).select("reviews"),
    notifications: await mongoose.model("Notification").find({ userId }),
  };
  
  return userData;
};

// Export user data as JSON
export const exportUserData = async (userId: string): Promise<string> => {
  const userData = await getUserData(userId);
  
  // Create temporary directory
  const exportDir = `./temp/exports/${userId}`;
  await fs.ensureDir(exportDir);
  
  // Write data to JSON file
  const jsonPath = `${exportDir}/user_data.json`;
  await fs.writeJSON(jsonPath, userData, { spaces: 2 });
  
  // Create ZIP archive
  const zipPath = `${exportDir}/user_data.zip`;
  const output = fs.createWriteStream(zipPath);
  const archive = archiver("zip", {
    zlib: { level: 9 },
  });
  
  archive.pipe(output);
  archive.file(jsonPath, { name: "user_data.json" });
  await archive.finalize();
  
  // Remove JSON file
  await fs.remove(jsonPath);
  
  return zipPath;
};

// Delete user data (right to be forgotten)
export const deleteUserData = async (userId: string): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // Delete user
    await userModel.findByIdAndDelete(userId).session(session);
    
    // Delete related data
    await mongoose.model("Order").deleteMany({ userId }).session(session);
    await mongoose.model("Notification").deleteMany({ userId }).session(session);
    
    // Anonymize reviews
    await mongoose.model("Course").updateMany(
      { "reviews.user._id": userId },
      {
        $set: {
          "reviews.$[elem].user.name": "Anonymous",
          "reviews.$[elem].user.email": "anonymous@example.com",
          "reviews.$[elem].user.avatar.url": "",
        },
      },
      {
        arrayFilters: [{ "elem.user._id": userId }],
        session,
      }
    );
    
    // Delete any related files (e.g., avatar)
    // TODO: Implement Cloudinary deletion
    
    // Commit transaction
    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

// Controller for data portability
export const downloadUserData = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?._id;
      
      if (!userId) {
        return next(new ErrorHandler("User not found", 404));
      }
      
      // Generate export
      const zipPath = await exportUserData(userId.toString());
      
      // Set headers
      res.download(zipPath, "user_data.zip", (err) => {
        // Clean up after download
        fs.remove(zipPath);
        
        if (err) {
          next(new ErrorHandler("Error downloading data", 500));
        }
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// Controller for right to be forgotten
export const deleteAccount = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?._id;
      
      if (!userId) {
        return next(new ErrorHandler("User not found", 404));
      }
      
      // Delete user data
      await deleteUserData(userId.toString());
      
      // Clear cookies
      res.cookie("access_token", "", { maxAge: 1 });
      res.cookie("refresh_token", "", { maxAge: 1 });
      
      res.status(200).json({
        success: true,
        message: "Account deleted successfully",
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);
```

### 9.2. Data Retention Policy

```typescript
// Backend/utils/dataRetention.ts
import cron from "node-cron";
import mongoose from "mongoose";
import fs from "fs-extra";
import { securityLogger } from "./logger";

// Schedule data retention jobs
export const setupDataRetentionJobs = () => {
  // Clean up inactive users (not verified after 30 days)
  cron.schedule("0 0 * * *", async () => {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const result = await mongoose.model("User").deleteMany({
        isVerified: false,
        createdAt: { $lt: thirtyDaysAgo },
      });
      
      securityLogger.info(`Deleted ${result.deletedCount} inactive users`);
    } catch (error: any) {
      securityLogger.error(`Error cleaning up inactive users: ${error.message}`);
    }
  });
  
  // Clean up temp files (older than 24 hours)
  cron.schedule("0 * * * *", async () => {
    try {
      const tempDir = "./temp";
      
      if (await fs.pathExists(tempDir)) {
        const files = await fs.readdir(tempDir);
        let deletedCount = 0;
        
        for (const file of files) {
          const filePath = `${tempDir}/${file}`;
          const stats = await fs.stat(filePath);
          
          const oneDayAgo = new Date();
          oneDayAgo.setDate(oneDayAgo.getDate() - 1);
          
          if (stats.mtime < oneDayAgo) {
            await fs.remove(filePath);
            deletedCount++;
          }
        }
        
        securityLogger.info(`Deleted ${deletedCount} temporary files`);
      }
    } catch (error: any) {
      securityLogger.error(`Error cleaning up temp files: ${error.message}`);
    }
  });
  
  // Archive old notification data (older than 90 days)
  cron.schedule("0 0 1 * *", async () => {
    try {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      
      // Find old notifications
      const oldNotifications = await mongoose.model("Notification").find({
        createdAt: { $lt: ninetyDaysAgo },
      });
      
      if (oldNotifications.length > 0) {
        // Archive to file
        const archiveDir = "./archives/notifications";
        await fs.ensureDir(archiveDir);
        
        const archiveFile = `${archiveDir}/notifications_${new Date().toISOString().slice(0, 10)}.json`;
        await fs.writeJSON(archiveFile, oldNotifications, { spaces: 2 });
        
        // Delete from database
        await mongoose.model("Notification").deleteMany({
          createdAt: { $lt: ninetyDaysAgo },
        });
        
        securityLogger.info(`Archived ${oldNotifications.length} old notifications`);
      }
    } catch (error: any) {
      securityLogger.error(`Error archiving old notifications: ${error.message}`);
    }
  });
};
```

## 10. Dependency Security

### 10.1. Dependency Scanning

```typescript
// package.json custom scripts
{
  "scripts": {
    // ...existing scripts
    "security:audit": "npm audit --production",
    "security:snyk": "snyk test",
    "deps:outdated": "npm outdated",
    "deps:update": "npm update"
  }
}
```

### 10.2. Dependency Management

```typescript
// Backend/utils/dependencyCheck.ts
import fs from "fs-extra";
import path from "path";
import { securityLogger } from "./logger";

// Script to check for known vulnerable dependencies
export const checkVulnerableDependencies = async (): Promise<boolean> => {
  try {
    // Path to vulnerability database (can be periodically updated)
    const vulnerabilityDbPath = path.join(__dirname, "../data/vulnerability-db.json");
    
    // Load vulnerability database
    const vulnerabilityDb = await fs.readJSON(vulnerabilityDbPath);
    
    // Load package.json
    const packageJsonPath = path.join(__dirname, "../../package.json");
    const packageJson = await fs.readJSON(packageJsonPath);
    
    // Check dependencies
    const vulnerabilities = [];
    
    for (const [name, version] of Object.entries({
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    })) {
      // Check if package is in vulnerability database
      if (vulnerabilityDb[name]) {
        const packageVulnerabilities = vulnerabilityDb[name].filter(
          (v: any) => isVersionVulnerable(version as string, v.versions)
        );
        
        if (packageVulnerabilities.length > 0) {
          vulnerabilities.push({
            package: name,
            version,
            vulnerabilities: packageVulnerabilities,
          });
        }
      }
    }
    
    // Log vulnerabilities
    if (vulnerabilities.length > 0) {
      securityLogger.warn("Vulnerable dependencies found", { vulnerabilities });
      return false;
    }
    
    return true;
  } catch (error: any) {
    securityLogger.error(`Error checking dependencies: ${error.message}`);
    return false;
  }
};

// Helper to check if a version is vulnerable
function isVersionVulnerable(
  currentVersion: string,
  vulnerableVersions: string[]
): boolean {
  // Simple version comparison (should use semver in production)
  return vulnerableVersions.some((v) => v === currentVersion || v === "*");
}
```