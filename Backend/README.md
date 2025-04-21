# Backend E-Learning

Backend của hệ thống E-Learning được xây dựng trên Express.js với TypeScript, cung cấp API RESTful và xử lý logic nghiệp vụ cho ứng dụng.

## Công Nghệ & Framework

### Core Technologies
- **Express.js**: Web framework cho Node.js
- **TypeScript**: Ngôn ngữ lập trình tĩnh kiểu
- **MongoDB**: Cơ sở dữ liệu NoSQL
- **Mongoose**: ODM (Object Data Modeling) cho MongoDB

### Authentication & Security
- **JWT (jsonwebtoken)**: Xác thực token-based
- **bcryptjs**: Hash mật khẩu
- **cookie-parser**: Xử lý cookie

### File Handling
- **Multer**: Xử lý file upload
- **Cloudinary**: Lưu trữ đám mây cho file media
- **ffmpeg**: Xử lý video
- **fs-extra**: Thao tác file mở rộng

### Email & Notifications
- **Nodemailer**: Gửi email
- **ejs**: Template engine cho email

### Payment Processing
- **Stripe**: Xử lý thanh toán

### Realtime
- **Socket.IO**: Giao tiếp realtime

### AI Integration
- **Google Generative AI**: Tích hợp trí tuệ nhân tạo

### Caching
- **IORedis**: Redis client cho cache

## Cấu Trúc Thư Mục

```
Backend/
│
├── @types/             # TypeScript type definitions
│
├── controller/         # Controllers xử lý request
│   ├── analytics.controller.ts
│   ├── course.controller.ts
│   ├── layout.controller.ts
│   ├── notification.controller.ts
│   ├── order.controller.ts
│   └── user.controller.ts
│
├── mails/              # Templates email
│
├── middleware/         # Middleware
│   ├── auth.ts         # Authentication middleware
│   ├── catchAsyncError.ts
│   ├── error.ts        # Error handling
│   └── ...
│
├── models/             # Mongoose models
│   ├── ai.model.ts
│   ├── course.model.ts
│   ├── layout.model.ts
│   ├── notification.model.ts
│   ├── order.model.ts
│   ├── subtitle.model.ts
│   └── user.model.ts
│
├── routes/             # API routes
│   ├── analytics.route.ts
│   ├── course.route.ts
│   ├── layout.route.ts
│   ├── notification.route.ts
│   ├── order.route.ts
│   └── user.route.ts
│
├── services/           # Business logic services
│
├── uploads/            # Temporary storage for uploads
│
├── utils/              # Utility functions
│   ├── db.ts           # Database connection
│   ├── ErrorHandler.ts # Custom error handling
│   ├── jwt.ts          # JWT utilities
│   ├── sendMail.ts     # Email sending utility
│   └── ...
│
├── app.ts              # Express application setup
├── server.ts           # Server entry point
└── socketServer.ts     # Socket.IO setup
```

## Models (Cấu Trúc Dữ Liệu)

### 1. User Model

```typescript
// Cấu trúc đơn giản hóa từ user.model.ts
interface IUser {
  name: string;
  email: string;
  password: string;
  avatar?: { public_id: string; url: string };
  role: 'user' | 'admin';
  isVerified: boolean;
  courses: Array<{ courseId: string }>;
  comparePassword: (password: string) => Promise<boolean>;
  createdAt: Date;
}
```

### 2. Course Model

```typescript
// Cấu trúc đơn giản hóa từ course.model.ts
interface ICourse {
  name: string;
  description: string;
  categories: string[];
  price: number;
  estimatedPrice?: number;
  thumbnail: { public_id: string; url: string };
  tags: string[];
  level: string;
  demoUrl: string;
  benefits: { title: string }[];
  prerequisites: { title: string }[];
  reviews: Array<{ user: IUser; rating: number; comment: string }>;
  courseData: Array<{
    title: string;
    description: string;
    videoUrl: string;
    videoThumbnail: { public_id: string; url: string };
    videoSection: string;
    videoLength: number;
    videoPlayer: string;
    links: { title: string; url: string }[];
    suggestion: string;
  }>;
  ratings: number;
  purchased: number;
  createdAt: Date;
}
```

### 3. Order Model

```typescript
// Cấu trúc đơn giản hóa từ order.model.ts
interface IOrder {
  courseId: string;
  userId: string;
  payment_info: {
    id: string;
    status: string;
    type: string;
  };
  createdAt: Date;
}
```

## API Routes

### User Routes

| Endpoint                  | Phương Thức | Mô Tả                            | Middleware       |
|---------------------------|-------------|---------------------------------|-----------------|
| `/api/v1/register`        | POST        | Đăng ký tài khoản               | -               |
| `/api/v1/activate-user`   | POST        | Xác thực email                  | -               |
| `/api/v1/login`           | POST        | Đăng nhập                       | -               |
| `/api/v1/logout`          | GET         | Đăng xuất                       | isAuthenticated |
| `/api/v1/refresh-token`   | GET         | Làm mới token                   | -               |
| `/api/v1/me`              | GET         | Thông tin user hiện tại         | isAuthenticated |
| `/api/v1/update-user-info`| PUT         | Cập nhật thông tin              | isAuthenticated |
| `/api/v1/update-password` | PUT         | Đổi mật khẩu                    | isAuthenticated |
| `/api/v1/get-users`       | GET         | Lấy danh sách users (Admin)     | isAuthenticated, authorizeRoles('admin') |

### Course Routes

| Endpoint                  | Phương Thức | Mô Tả                           | Middleware       |
|---------------------------|-------------|----------------------------------|-----------------|
| `/api/v1/create-course`   | POST        | Tạo khóa học mới (Admin)        | isAuthenticated, authorizeRoles('admin') |
| `/api/v1/get-course/:id`  | GET         | Lấy thông tin khóa học          | -               |
| `/api/v1/get-courses`     | GET         | Lấy danh sách khóa học          | -               |
| `/api/v1/edit-course/:id` | PUT         | Chỉnh sửa khóa học (Admin)      | isAuthenticated, authorizeRoles('admin') |
| `/api/v1/generate-video-subtitle/:id` | GET | Tạo phụ đề cho video       | isAuthenticated |
| `/api/v1/add-question`    | PUT         | Thêm câu hỏi vào khóa học       | isAuthenticated |
| `/api/v1/add-review/:id`  | PUT         | Thêm đánh giá khóa học          | isAuthenticated |

### Order Routes

| Endpoint                  | Phương Thức | Mô Tả                           | Middleware       |
|---------------------------|-------------|----------------------------------|-----------------|
| `/api/v1/create-order`    | POST        | Tạo đơn hàng mới                | isAuthenticated |
| `/api/v1/get-orders`      | GET         | Lấy danh sách đơn hàng (Admin)  | isAuthenticated, authorizeRoles('admin') |

### Analytics Routes

| Endpoint                  | Phương Thức | Mô Tả                           | Middleware       |
|---------------------------|-------------|----------------------------------|-----------------|
| `/api/v1/get-users-analytics` | GET     | Phân tích người dùng            | isAuthenticated, authorizeRoles('admin') |
| `/api/v1/get-courses-analytics` | GET   | Phân tích khóa học              | isAuthenticated, authorizeRoles('admin') |
| `/api/v1/get-orders-analytics` | GET    | Phân tích đơn hàng              | isAuthenticated, authorizeRoles('admin') |

## Logic Xử Lý Chính

### 1. Xác Thực & Phân Quyền

```
┌───────────┐       ┌───────────┐       ┌───────────┐
│           │       │           │       │           │
│ Request   │──────►│ Auth      │──────►│ JWT       │
│           │       │ Middleware│       │ Verification│
│           │       │           │       │           │
└───────────┘       └─────┬─────┘       └─────┬─────┘
                          │                   │
                    ┌─────▼─────┐       ┌─────▼─────┐
                    │           │       │           │
                    │ Role      │──────►│ Controller│
                    │ Check     │       │           │
                    │           │       │           │
                    └───────────┘       └───────────┘
```

Middleware `isAuthenticated` kiểm tra token JWT từ cookie. Middleware `authorizeRoles` kiểm tra vai trò user.

### 2. Upload & Xử Lý File

```
┌───────────┐       ┌───────────┐       ┌───────────┐
│           │       │           │       │           │
│ Multer    │──────►│ File      │──────►│ Cloudinary│
│ Upload    │       │ Processing│       │ Upload    │
│           │       │           │       │           │
└───────────┘       └─────┬─────┘       └─────┬─────┘
                          │                   │
                          │             ┌─────▼─────┐
                          │             │           │
                          └────────────►│ Database  │
                                        │ Update    │
                                        │           │
                                        └───────────┘
```

Video được xử lý với ffmpeg trước khi upload lên Cloudinary.

### 3. Xử Lý Thanh Toán

```
┌───────────┐       ┌───────────┐       ┌───────────┐
│           │       │           │       │           │
│ Payment   │──────►│ Stripe    │──────►│ Order     │
│ Request   │       │ Processing│       │ Creation  │
│           │       │           │       │           │
└───────────┘       └─────┬─────┘       └─────┬─────┘
                          │                   │
                    ┌─────▼─────┐       ┌─────▼─────┐
                    │           │       │           │
                    │ Course    │◄──────┤ Notification│
                    │ Access    │       │ Generation │
                    │           │       │           │
                    └───────────┘       └───────────┘
```

### 4. Realtime Notifications

```
┌───────────┐       ┌───────────┐       ┌───────────┐
│           │       │           │       │           │
│ User      │──────►│ Socket.IO │──────►│ Connected │
│ Action    │       │ Server    │       │ Clients   │
│           │       │           │       │           │
└───────────┘       └───────────┘       └───────────┘
```

Sử dụng Socket.IO để gửi thông báo realtime khi có sự kiện (đơn hàng mới, bình luận mới, v.v.).

### 5. Tích Hợp AI

```
┌───────────┐       ┌───────────┐       ┌───────────┐
│           │       │           │       │           │
│ Video     │──────►│ Google    │──────►│ Subtitle  │
│ Processing│       │ Gen AI    │       │ Generation│
│           │       │           │       │           │
└───────────┘       └───────────┘       └───────────┘
```

Google Generative AI được sử dụng để tạo phụ đề cho video và hỗ trợ AI chat.

## Bảo Mật & Xác Thực

### JWT Flow

```
┌───────────┐       ┌───────────┐       ┌───────────┐
│           │       │           │       │           │
│ Login     │──────►│ JWT Token │──────►│ HTTP-Only │
│ Success   │       │ Generation│       │ Cookie    │
│           │       │           │       │           │
└───────────┘       └───────────┘       └───────────┘
```

- Sử dụng HTTP-Only cookie để lưu trữ token
- Refresh token để làm mới access token
- Passwords được hash với bcryptjs

### Error Handling

```typescript
// Middleware/error.ts
export const ErrorMiddleware = (err: any, req: Request, res: Response, next: NextFunction) => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || "Internal server error";

  // Xử lý các loại lỗi cụ thể
  // ...

  res.status(err.statusCode).json({
    success: false,
    message: err.message,
  });
};
```

## Khởi Động Dự Án

1. **Cài đặt dependencies**
   ```bash
   npm install
   ```

2. **Cấu hình biến môi trường**
   - Tạo file `.env` từ `.env.example`
   - Cấu hình MongoDB URI, JWT, Cloudinary, Stripe, v.v.

3. **Chạy development server**
   ```bash
   npm run dev
   ```

4. **Build cho production**
   ```bash
   npm run build
   npm start
   ```

## Kết nối Database

```typescript
// utils/db.ts
import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI as string);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
```

## Các API Chính

### 1. Authentication API

```typescript
// Đăng ký
router.post("/register", registerUser);

// Đăng nhập
router.post("/login", loginUser);

// Đăng xuất
router.get("/logout", isAuthenticated, logoutUser);
```

### 2. Course API

```typescript
// Tạo khóa học
router.post(
  "/create-course",
  isAuthenticated,
  authorizeRoles("admin"),
  uploadCourse.single("thumbnail"),
  createCourse
);

// Lấy thông tin khóa học
router.get("/get-course/:id", getSingleCourse);

// Lấy danh sách khóa học
router.get("/get-courses", getAllCourses);
```

### 3. Order API

```typescript
// Tạo đơn hàng
router.post("/create-order", isAuthenticated, createOrder);

// Lấy danh sách đơn hàng
router.get(
  "/get-orders",
  isAuthenticated,
  authorizeRoles("admin"),
  getAllOrders
);
```

### 4. Analytics API

```typescript
// Phân tích người dùng
router.get(
  "/get-users-analytics",
  isAuthenticated,
  authorizeRoles("admin"),
  getUsersAnalytics
);

// Phân tích khóa học
router.get(
  "/get-courses-analytics",
  isAuthenticated,
  authorizeRoles("admin"),
  getCoursesAnalytics
);
```