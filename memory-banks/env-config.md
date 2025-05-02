# Cấu Hình Biến Môi Trường (Environment Variables)

Dự án E-Learning sử dụng biến môi trường để quản lý cấu hình và các thông tin nhạy cảm. Dưới đây là tổng quan về các biến môi trường được sử dụng trong dự án, được phân chia theo Frontend và Backend.

## Backend Environment Variables

File cấu hình: `Backend/.env`

```env
# Server Configuration
PORT=8000
ORIGIN=["http://localhost:3000"]
NODE_ENV=development

# Database Configuration
DB_URL=mongodb://127.0.0.1:27017/Elearning

# Cloudinary Configuration
CLOUD_NAME=your_cloudinary_name
CLOUD_API_KEY=your_cloudinary_api_key
CLOUD_SECRET_KEY=your_cloudinary_secret

# Redis Configuration (cho caching và session)
REDIS_URL=redis://localhost:6379

# JWT Configuration
ACTIVATION_SECRET=your_activation_secret
ACCESS_TOKEN=your_access_token_secret
REFRESH_TOKEN=your_refresh_token_secret
ACCESS_TOKEN_EXPIRE=5
REFRESH_TOKEN_EXPIRE=3

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SERVICE=gmail
SMTP_MAIL=your_email@gmail.com
SMTP_PASSWORD=your_app_password

# Payment Gateway (Stripe)
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key

# AI (Google Generative AI)
GEMINI_API_KEY=your_gemini_api_key
```

## Frontend Environment Variables

File cấu hình: `Frontend/.env`

```env
# API Configuration
NEXT_PUBLIC_SERVER_URI=http://localhost:8000/api/v1
NEXT_PUBLIC_SOCKET_SERVER_URI=http://localhost:8000

# Stripe Public Key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key

# Social Authentication
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
```

## Mục Đích Của Các Biến Môi Trường

### Backend

#### 1. Server Configuration
- **PORT**: Cổng mà server sẽ chạy (mặc định: 8000)
- **ORIGIN**: Danh sách các domain được phép truy cập API (CORS)
- **NODE_ENV**: Môi trường hoạt động (development, production, test)

#### 2. Database Configuration
- **DB_URL**: URL kết nối tới MongoDB, có thể là local hoặc MongoDB Atlas

#### 3. Cloudinary Configuration
- **CLOUD_NAME**: Tên Cloudinary cloud
- **CLOUD_API_KEY**: API key Cloudinary
- **CLOUD_SECRET_KEY**: Secret key Cloudinary

#### 4. Redis Configuration
- **REDIS_URL**: URL kết nối tới Redis server, sử dụng cho caching và session

#### 5. JWT Configuration
- **ACTIVATION_SECRET**: Secret key cho token kích hoạt tài khoản
- **ACCESS_TOKEN**: Secret key cho JWT access token
- **REFRESH_TOKEN**: Secret key cho JWT refresh token
- **ACCESS_TOKEN_EXPIRE**: Thời gian hết hạn của access token (phút)
- **REFRESH_TOKEN_EXPIRE**: Thời gian hết hạn của refresh token (ngày)

#### 6. Email Configuration
- **SMTP_HOST**: Host của SMTP server
- **SMTP_PORT**: Port của SMTP server
- **SMTP_SERVICE**: Dịch vụ email (gmail, outlook, etc.)
- **SMTP_MAIL**: Email gửi thư
- **SMTP_PASSWORD**: Mật khẩu hoặc app password của email

#### 7. Payment Gateway
- **STRIPE_SECRET_KEY**: Secret key của Stripe
- **STRIPE_PUBLISHABLE_KEY**: Publishable key của Stripe

#### 8. AI Configuration
- **GEMINI_API_KEY**: API key của Google Generative AI (Gemini)

### Frontend

#### 1. API Configuration
- **NEXT_PUBLIC_SERVER_URI**: URL của Backend API
- **NEXT_PUBLIC_SOCKET_SERVER_URI**: URL của Socket.IO server

#### 2. Stripe Configuration
- **NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY**: Publishable key của Stripe (client-side)

#### 3. NextAuth Configuration
- **NEXTAUTH_SECRET**: Secret key cho NextAuth
- **NEXTAUTH_URL**: URL của frontend application

#### 4. Social Authentication
- **GOOGLE_CLIENT_ID**: Client ID cho OAuth Google
- **GOOGLE_CLIENT_SECRET**: Client Secret cho OAuth Google
- **GITHUB_CLIENT_ID**: Client ID cho OAuth GitHub
- **GITHUB_CLIENT_SECRET**: Client Secret cho OAuth GitHub

## Hướng Dẫn Cấu Hình

### Backend

1. **Tạo file .env**:
   - Sao chép từ file `.env.example` sang `.env`
   - Điền các giá trị phù hợp

2. **MongoDB**:
   - Local: `mongodb://127.0.0.1:27017/Elearning`
   - MongoDB Atlas: `mongodb+srv://<username>:<password>@cluster.mongodb.net/Elearning`

3. **Cloudinary**:
   - Đăng ký tài khoản tại https://cloudinary.com
   - Lấy thông tin từ Dashboard

4. **Email Configuration**:
   - Nếu sử dụng Gmail, bạn cần tạo "App Password"
   - Bật "Less secure app access" nếu đang trong môi trường development

5. **Stripe**:
   - Đăng ký tài khoản tại https://stripe.com
   - Lấy API keys từ Dashboard
   - Trong môi trường development, có thể sử dụng test keys

6. **Google Generative AI**:
   - Đăng ký tại https://ai.google.dev/
   - Tạo API key cho Gemini model

### Frontend

1. **Tạo file .env**:
   - Sao chép từ file `.env.example` sang `.env`
   - Điền các giá trị phù hợp

2. **NextAuth**:
   - Tạo một chuỗi ngẫu nhiên cho NEXTAUTH_SECRET
   - Đặt NEXTAUTH_URL thành URL của frontend

3. **Social Authentication**:
   - **Google**:
     - Truy cập Google Cloud Console
     - Tạo project mới
     - Enable Google Identity OAuth API
     - Tạo OAuth Client ID cho Web Application
     - Thêm Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
   
   - **GitHub**:
     - Truy cập GitHub Developer Settings
     - Tạo OAuth App mới
     - Thêm Authorization callback URL: `http://localhost:3000/api/auth/callback/github`

## Sử Dụng Biến Môi Trường

### Backend (Node.js / Express)

```typescript
// Đọc biến môi trường với dotenv
import dotenv from "dotenv";
dotenv.config();

// Hoặc ngắn gọn hơn
require("dotenv").config();

// Sử dụng biến môi trường
const port = process.env.PORT || 8000;
const mongoUrl = process.env.DB_URL;
const jwtSecret = process.env.ACCESS_TOKEN;

// Ví dụ: Cấu hình Cloudinary
import { v2 as cloudinary } from "cloudinary";
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_SECRET_KEY,
});
```

### Frontend (Next.js)

```typescript
// Trong client components - Chỉ có thể sử dụng biến bắt đầu bằng NEXT_PUBLIC_
"use client";

const apiUrl = process.env.NEXT_PUBLIC_SERVER_URI;
const socketUrl = process.env.NEXT_PUBLIC_SOCKET_SERVER_URI;

// Ví dụ: Cấu hình Axios
import axios from "axios";
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_SERVER_URI,
});

// Ví dụ: Kết nối Socket.IO
import socketIO from "socket.io-client";
const socket = socketIO(process.env.NEXT_PUBLIC_SOCKET_SERVER_URI || "", {
  transports: ["websocket"],
});
```

```typescript
// Trong server components - Có thể sử dụng tất cả biến môi trường
const apiUrl = process.env.NEXT_PUBLIC_SERVER_URI;
const googleClientId = process.env.GOOGLE_CLIENT_ID;
```

### Server-side API Routes (Next.js)

```typescript
// pages/api/auth/[...nextauth].ts
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GithubProvider from "next-auth/providers/github";

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
  ],
  secret: process.env.NEXTAUTH_SECRET,
});
```

## Phân Biệt Môi Trường

### Backend

```typescript
// app.ts
const isProduction = process.env.NODE_ENV === "production";

// CORS options
app.use(
  cors({
    origin: isProduction
      ? JSON.parse(process.env.ORIGIN || '["https://yourdomain.com"]')
      : true,
    credentials: true,
  })
);

// Cookie options
const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "strict" : "lax",
};
```

### Frontend

```typescript
// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    APP_ENV: process.env.NODE_ENV,
  },
  // Các cấu hình khác
};

export default nextConfig;

// Sử dụng trong component
const isDevelopment = process.env.APP_ENV === "development";
```

## Quản Lý Bảo Mật

1. **Không commit file .env lên Git**:
   - Thêm `.env` vào `.gitignore`
   - Sử dụng `.env.example` làm template (không chứa thông tin nhạy cảm)

2. **Xoay vòng (rotate) các key định kỳ**:
   - JWT secrets
   - API keys

3. **Sử dụng các biến khác nhau cho môi trường khác nhau**:
   - Development
   - Staging
   - Production

4. **Validation**:
   - Kiểm tra sự tồn tại của các biến môi trường cần thiết khi khởi động ứng dụng

```typescript
// Ví dụ: Validate required environment variables
const requiredEnvVars = [
  "DB_URL",
  "ACCESS_TOKEN",
  "REFRESH_TOKEN",
  "SMTP_MAIL",
  "STRIPE_SECRET_KEY",
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Error: Environment variable ${envVar} is missing`);
    process.exit(1);
  }
}
```

## Các Biến Môi Trường Theo Môi Trường

### Development

```env
NODE_ENV=development
PORT=8000
DB_URL=mongodb://127.0.0.1:27017/Elearning
ORIGIN=["http://localhost:3000"]
```

### Production

```env
NODE_ENV=production
PORT=8000
DB_URL=mongodb+srv://user:password@cluster.mongodb.net/Elearning
ORIGIN=["https://your-production-domain.com"]
```

### Testing

```env
NODE_ENV=test
PORT=8001
DB_URL=mongodb://127.0.0.1:27017/Elearning_test
```

## Sử Dụng Biến Môi Trường Trong Các File Docker

### Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Biến build-time
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

RUN npm run build

EXPOSE 8000

CMD ["npm", "start"]
```

### Docker Compose

```yaml
version: '3'
services:
  backend:
    build: ./Backend
    ports:
      - "8000:8000"
    environment:
      - NODE_ENV=production
      - PORT=8000
      - DB_URL=mongodb://mongo:27017/Elearning
    depends_on:
      - mongo
      - redis

  frontend:
    build: ./Frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_SERVER_URI=http://backend:8000/api/v1
      - NEXT_PUBLIC_SOCKET_SERVER_URI=http://backend:8000

  mongo:
    image: mongo
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db

  redis:
    image: redis
    ports:
      - "6379:6379"

volumes:
  mongo-data:
```

## Mẹo Sử Dụng Biến Môi Trường

1. **Tạo Helper/Config Module**:
   - Tạo một module config để đọc và xác thực tất cả biến môi trường
   - Cung cấp type-safety với TypeScript

```typescript
// Backend/utils/config.ts
import dotenv from "dotenv";
dotenv.config();

interface Config {
  port: number;
  nodeEnv: string;
  mongoUrl: string;
  jwtSecret: string;
  jwtExpire: string;
  // Các biến khác
}

const config: Config = {
  port: parseInt(process.env.PORT || "8000", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  mongoUrl: process.env.DB_URL || "mongodb://localhost:27017/Elearning",
  jwtSecret: process.env.JWT_SECRET || "default-secret-key",
  jwtExpire: process.env.JWT_EXPIRE || "1d",
  // Các biến khác
};

// Validation
if (!process.env.DB_URL) {
  console.warn("Warning: DB_URL is not defined in environment variables");
}

// Validation for production
if (config.nodeEnv === "production" && config.jwtSecret === "default-secret-key") {
  throw new Error("In production, JWT_SECRET must be set in environment variables");
}

export default config;

// Sử dụng
import config from "./utils/config";
app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});
```

2. **Sử dụng .env.local cho các giá trị cục bộ**:
   - Next.js hỗ trợ nhiều file .env:
     - `.env`: Mặc định, được commit
     - `.env.local`: Ghi đè .env, không được commit
     - `.env.development`, `.env.production`: Môi trường cụ thể

3. **Sử dụng Environment Variables trong CI/CD**:
   - GitHub Actions: Sử dụng secrets
   - Vercel/Netlify: Cấu hình trong dashboard
   - Docker: Sử dụng ARG và ENV

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Build
        run: npm run build
        env:
          DB_URL: ${{ secrets.DB_URL }}
          JWT_SECRET: ${{ secrets.JWT_SECRET }}
```