# Tổng Quan Dự Án E-Learning

Hệ thống E-Learning là nền tảng học trực tuyến toàn diện cho phép người dùng tiếp cận các khóa học, thanh toán và tương tác với các tính năng thông minh hỗ trợ bởi trí tuệ nhân tạo (AI).

## Kiến Trúc Tổng Thể

```
┌────────────────┐     ┌────────────────┐     ┌────────────────┐
│                │     │                │     │                │
│    Frontend    │◄───►│     Backend    │◄───►│    Database    │
│   (Next.js)    │     │   (Express)    │     │   (MongoDB)    │
│                │     │                │     │                │
└────────────────┘     └────────────────┘     └────────────────┘
         ▲                     ▲                      ▲
         │                     │                      │
         ▼                     ▼                      ▼
┌────────────────┐     ┌────────────────┐     ┌────────────────┐
│                │     │                │     │                │
│  Authentication│     │  File Storage  │     │  External APIs │
│   (NextAuth)   │     │  (Cloudinary)  │     │ (Stripe, AI)   │
│                │     │                │     │                │
└────────────────┘     └────────────────┘     └────────────────┘
```

## Các Thành Phần Chính

### 1. Frontend (Next.js)
- **Framework**: Next.js với TypeScript
- **State Management**: Redux Toolkit
- **Giao diện**: Tailwind CSS, Material UI
- **Authentication**: NextAuth.js
- **Thanh toán**: Stripe

### 2. Backend (Express)
- **Framework**: Express.js với TypeScript
- **Database**: MongoDB (mongoose)
- **Authentication**: JWT (JSON Web Tokens)
- **File Upload**: Multer, Cloudinary
- **Email**: Nodemailer
- **Real-time**: Socket.IO

### 3. Database (MongoDB)
- **Mô hình dữ liệu chính**:
  - Users (Người dùng)
  - Courses (Khóa học)
  - Orders (Đơn hàng)
  - Notifications (Thông báo)
  - Layouts (Bố cục giao diện)
  - AI (Dữ liệu AI)
  - Subtitles (Phụ đề)

### 4. Tích Hợp Bên Thứ Ba
- **Thanh toán**: Stripe
- **Lưu trữ đám mây**: Cloudinary
- **AI**: Google Generative AI (Gemini)

### 5. Tính Năng Realtime
- **Socket.IO**: Thông báo realtime

## Luồng Xử Lý Chính

### 1. Quá Trình Đăng Ký & Đăng Nhập
- Đăng ký người dùng
- Xác thực qua email
- Đăng nhập (JWT)
- Đăng nhập mạng xã hội

### 2. Tạo & Quản Lý Khóa Học (Admin)
- Tạo khóa học mới
- Upload video và tài liệu
- Quản lý nội dung
- Cập nhật thông tin

### 3. Mua & Truy Cập Khóa Học
- Duyệt danh sách khóa học
- Thanh toán qua Stripe
- Tạo đơn hàng
- Truy cập nội dung khóa học đã mua

### 4. Tương Tác AI Trong Khóa Học
- Xem video khóa học
- Chat với AI về nội dung
- Tự động sinh tóm tắt
- Tương tác với nội dung thông minh

## Các Chức Năng Chính

### Phía Người Dùng
- Đăng ký/đăng nhập
- Duyệt và tìm kiếm khóa học
- Thanh toán khóa học qua Stripe
- Xem video khóa học
- Tương tác với AI chat
- Quản lý hồ sơ người dùng
- Nhận thông báo realtime

### Phía Admin
- Quản lý người dùng
- Tạo và chỉnh sửa khóa học
- Xem phân tích dữ liệu
- Quản lý đơn hàng
- Tùy chỉnh giao diện hệ thống