# Hệ Thống E-Learning

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

### Các Thành Phần Chính

1. **Frontend (Next.js)**
   - Framework: Next.js với TypeScript
   - State Management: Redux Toolkit
   - Giao diện: Tailwind CSS, Material UI
   - Authentication: NextAuth.js
   - Tích hợp thanh toán: Stripe

2. **Backend (Express)**
   - Framework: Express.js với TypeScript
   - Database: MongoDB (mongoose)
   - Authentication: JWT (JSON Web Tokens)
   - File Upload: Multer, Cloudinary
   - Email: Nodemailer
   - Real-time: Socket.IO

3. **Database (MongoDB)**
   - Mô hình dữ liệu chính:
     - Users (Người dùng)
     - Courses (Khóa học)
     - Orders (Đơn hàng)
     - Notifications (Thông báo)
     - Layouts (Bố cục giao diện)

4. **Tích Hợp Bên Thứ Ba**
   - Thanh toán: Stripe
   - Lưu trữ đám mây: Cloudinary
   - AI: Google Generative AI

5. **Tính Năng Realtime**
   - Socket.IO: Thông báo realtime

## Luồng Xử Lý Chính

### 1. Quá Trình Đăng Ký & Đăng Nhập

```
┌───────────┐      ┌───────────┐      ┌───────────┐      ┌───────────┐
│           │      │           │      │           │      │           │
│  Người    │─────►│ Form      │─────►│ Backend   │─────►│ Database  │
│  Dùng     │      │ Đăng Ký   │      │ Validation│      │ (MongoDB) │
│           │      │           │      │           │      │           │
└───────────┘      └───────────┘      └─────┬─────┘      └─────┬─────┘
                                            │                  │
                                            ▼                  ▼
                                      ┌───────────┐      ┌───────────┐
                                      │           │      │           │
                                      │ Email     │◄─────┤ Lưu thông │
                                      │ Xác thực  │      │ tin user  │
                                      │           │      │           │
                                      └─────┬─────┘      └───────────┘
                                            │
                                            ▼
                                      ┌───────────┐
                                      │           │
                                      │ Đăng nhập │
                                      │ thành công│
                                      │           │
                                      └───────────┘
```

### 2. Tạo & Quản Lý Khóa Học (Admin)

```
┌───────────┐      ┌───────────┐      ┌───────────┐      ┌───────────┐
│           │      │           │      │           │      │           │
│  Admin    │─────►│ Form      │─────►│ Backend   │─────►│ Database  │
│           │      │ Khóa Học  │      │ Processing│      │ (MongoDB) │
│           │      │           │      │           │      │           │
└───────────┘      └───────────┘      └─────┬─────┘      └─────┬─────┘
                                            │                  │
                                            ▼                  ▼
                                      ┌───────────┐      ┌───────────┐
                                      │           │      │           │
                                      │ Upload    │─────►│ Cloudinary│
                                      │ Files     │      │           │
                                      │           │      │           │
                                      └───────────┘      └───────────┘
```

### 3. Mua & Truy Cập Khóa Học

```
┌───────────┐      ┌───────────┐      ┌───────────┐      ┌───────────┐
│           │      │           │      │           │      │           │
│  Người    │─────►│ Trang     │─────►│ Checkout  │─────►│ Stripe    │
│  Dùng     │      │ Khóa Học  │      │ Process   │      │ Payment   │
│           │      │           │      │           │      │           │
└───────────┘      └───────────┘      └─────┬─────┘      └─────┬─────┘
                                            │                  │
                                            ▼                  ▼
                                      ┌───────────┐      ┌───────────┐
                                      │           │      │           │
                                      │ Order     │─────►│ Database  │
                                      │ Creation  │      │ (MongoDB) │
                                      │           │      │           │
                                      └─────┬─────┘      └───────────┘
                                            │
                                            ▼
                                      ┌───────────┐
                                      │           │
                                      │ Truy cập  │
                                      │ Khóa Học  │
                                      │           │
                                      └───────────┘
```

### 4. Tương Tác AI Trong Khóa Học

```
┌───────────┐      ┌───────────┐      ┌───────────┐      ┌───────────┐
│           │      │           │      │           │      │           │
│  Người    │─────►│ Xem Video │─────►│ AI Chat   │─────►│ Google    │
│  Dùng     │      │ Khóa Học  │      │ Component │      │ Gen AI    │
│           │      │           │      │           │      │           │
└───────────┘      └───────────┘      └─────┬─────┘      └─────┬─────┘
                                            │                  │
                                            ▼                  ▼
                                      ┌───────────┐      ┌───────────┐
                                      │           │      │           │
                                      │ Process   │◄─────┤ AI        │
                                      │ Response  │      │ Response  │
                                      │           │      │           │
                                      └───────────┘      └───────────┘
```

## Tổng Quan Chức Năng

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

## Kết Luận

Dự án E-Learning cung cấp một nền tảng học tập trực tuyến hiện đại với đầy đủ tính năng từ quản lý khóa học, thanh toán, đến tích hợp AI. Kiến trúc chia thành Frontend (Next.js) và Backend (Express) giúp phát triển và mở rộng dễ dàng, đồng thời tận dụng các công nghệ hiện đại như Redux, Socket.IO và Google Generative AI để cung cấp trải nghiệm học tập tối ưu.