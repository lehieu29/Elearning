# Tech Stack Dự Án E-Learning

## 1. Frontend

### Core Framework & Language
- **Next.js** (v14.1.0) - Framework React với Server-Side Rendering và Static Generation
- **TypeScript** - Ngôn ngữ lập trình phía client
- **React** (v18) - Thư viện JavaScript UI

### State Management
- **Redux Toolkit** (v2.2.1) - Quản lý state global
- **React-Redux** (v9.1.0) - Kết nối React với Redux
- **React Context API** - Quản lý state cho các tính năng như Video Queue

### UI/UX
- **Tailwind CSS** (v3.3.0) - Framework CSS utility-first
- **Material UI** (v5.15.10) - Component library
  - **@mui/icons-material** (v5.15.10)
  - **@mui/material** (v5.15.10)
  - **@mui/x-data-grid** (v6.19.5)
- **React Icons** (v5.0.1) - Bộ sưu tập icons
- **React Pro Sidebar** (v0.7.1) - Thanh sidebar cho admin panel

### Authentication & Authorization
- **NextAuth.js** (v4.24.6) - Authentication cho Next.js
- **next-themes** (v0.2.1) - Hỗ trợ dark/light mode

### Form Handling & Validation
- **Formik** (v2.4.5) - Xử lý form
- **Yup** (v1.3.3) - Schema validation

### API & Data Fetching
- **Axios** (v1.6.7) - HTTP client
- **RTK Query** - API management (từ Redux Toolkit)

### Payment Processing
- **@stripe/react-stripe-js** (v2.5.1)
- **@stripe/stripe-js** (v3.0.6)

### Notifications & UI Feedback
- **react-hot-toast** (v2.4.1) - Toast notifications
- **framer-motion** - Animations cho UI components

### Charts & Data Visualization
- **Recharts** (v2.12.1) - Thư viện biểu đồ

### Real-time Communication
- **socket.io-client** (v4.7.4) - Client WebSocket

### AI Integration
- **@google/generative-ai** (v0.3.1) - Tích hợp Google Gemini

### Utilities
- **timeago.js** (v4.0.2) - Format time
- **uuid** - Tạo ID duy nhất

## 2. Backend

### Core Framework & Language
- **Express.js** - Web framework cho Node.js
- **TypeScript** - Ngôn ngữ lập trình phía server

### Database
- **MongoDB** - NoSQL database
- **Mongoose** (v8.1.1) - ODM cho MongoDB

### Authentication & Security
- **bcryptjs** (v2.4.3) - Hashing password
- **jsonwebtoken** (v9.0.2) - JWT authentication
- **cookie-parser** (v1.4.6) - Parse cookies

### File Processing
- **multer** (v1.4.5-lts.2) - Upload files
- **cloudinary** (v2.0.0) - Cloud storage
- **@ffmpeg-installer/ffmpeg** (v1.1.0) - Xử lý video
- **fluent-ffmpeg** (v2.1.3) - FFmpeg wrapper
- **subtitle** (v4.2.2-alpha.0) - Xử lý phụ đề

### Email
- **nodemailer** (v6.9.9) - Gửi email
- **ejs** (v3.1.9) - Template engine

### API & Request Handling
- **cors** (v2.8.5) - Cross-Origin Resource Sharing
- **axios** (v1.6.7) - HTTP client

### Payment Processing
- **stripe** (v14.18.0) - Payment gateway

### Real-time Communication
- **socket.io** (v4.7.4) - Server WebSocket
- **@socket.io/redis-adapter** - Redis adapter cho Socket.IO clustering

### Task Queue & Processing
- **bull** - Redis-based queue cho xử lý background tasks
- **node-cron** (v3.0.3) - Cron jobs

### AI Integration
- **@google/generative-ai** (v0.24.0) - Tích hợp Google Gemini API

### File System
- **fs-extra** (v11.3.0) - File system utilities
- **path** - Path utilities

### Caching & Data Storage
- **ioredis** (v5.3.2) - Redis client cho caching và adapter
- **Redis** - In-memory data store cho caching và pub/sub

### Video Processing
- **FFmpeg** - Xử lý và chuyển đổi video
- **Video transcoding utilities**:
  - Phát hiện khoảng lặng (silence detection)
  - Phân tích và phân đoạn video
  - Tạo và gắn phụ đề

### Development Tools
- **ts-node-dev** (v2.0.0) - TypeScript execution & development
- **dotenv** (v16.4.1) - Environment variables
- **cluster** - Node.js clustering cho multi-core processing

## 3. Development & Build Tools

### Common
- **TypeScript** - Static typing
- **ESLint** - Code linting
- **Node.js** (v18.x) - JavaScript runtime

### Frontend Specific
- **Autoprefixer** - CSS vendor prefixing
- **PostCSS** - CSS transformer
- **eslint-config-next** - ESLint config for Next.js

## 4. DevOps & Deployment

- **Node.js** v18.x environment
- **Clustering** - Horizontal scaling với Node.js cluster module
- **Redis** - Pub/Sub cho Socket.IO với nhiều instances
- **MongoDB Atlas** - Managed database
- **Docker** - Containerization cho development và production
- **k8s (Kubernetes)** - Container orchestration

## 5. Third-Party Services

- **Stripe** - Payment processing
- **Cloudinary** - Media hosting và streaming
- **Google Generative AI (Gemini)** - AI services cho tạo phụ đề và phân tích
- **MongoDB Atlas** - Managed database
- **SMTP Service** (cho Nodemailer) - Email sending

## 6. Real-time & Processing Features

### 1. Socket.IO Implementation
- **Socket.IO Server** - Xử lý kết nối realtime
- **Socket.IO Client** - Kết nối với server từ React components
- **Redis Adapter** - Cho phép Socket.IO hoạt động với nhiều instances

### 2. Video Processing Pipeline
- **FFmpeg Integration** - Xử lý video với Node.js
- **Gemini AI Integration** - Tạo phụ đề tự động
- **Bull Queue** - Hàng đợi xử lý video
- **Worker Threads** - Parallel processing cho video
- **Subtitle Generation & Styling** - Custom subtitle formats

### 3. Real-time UI Components
- **Video Queue Context** - Quản lý trạng thái và hiển thị tiến trình video
- **Socket Context** - Quản lý kết nối Socket.IO
- **Notification System** - Realtime notifications
- **Toast Notifications** - UI feedback

## 7. Testing & Monitoring

- **Jest** - Unit và integration testing
- **Socket.IO Testing** - Testing các tính năng realtime
- **Redis Monitoring** - Giám sát Redis cho Socket.IO adapter và queue
- **Bull Dashboard** - Monitoring cho video processing queue
- **Socket.IO Admin UI** - Monitoring realtime connections