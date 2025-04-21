# API Reference

Dưới đây là danh sách các API endpoints chính trong hệ thống E-Learning, phân chia theo nhóm chức năng.

## 1. User API

Base path: `/api/v1`

### Authentication

| Endpoint | Method | Description | Authentication | Role |
|----------|--------|-------------|----------------|------|
| `/registration` | POST | Đăng ký tài khoản mới | No | - |
| `/activate-user` | POST | Kích hoạt tài khoản sau khi đăng ký | No | - |
| `/login` | POST | Đăng nhập | No | - |
| `/logout` | GET | Đăng xuất | Yes | - |
| `/me` | GET | Lấy thông tin người dùng hiện tại | Yes | - |
| `/social-auth` | POST | Đăng nhập qua mạng xã hội | No | - |
| `/update-user-info` | PUT | Cập nhật thông tin người dùng | Yes | - |
| `/update-user-password` | PUT | Cập nhật mật khẩu | Yes | - |
| `/update-user-avatar` | PUT | Cập nhật ảnh đại diện | Yes | - |

### Admin User Management

| Endpoint | Method | Description | Authentication | Role |
|----------|--------|-------------|----------------|------|
| `/get-users` | GET | Lấy danh sách tất cả người dùng | Yes | Admin |
| `/update-user` | PUT | Cập nhật vai trò người dùng | Yes | Admin |
| `/delete-user/:id` | DELETE | Xóa người dùng | Yes | Admin |

## 2. Course API

Base path: `/api/v1`

### Public Course Endpoints

| Endpoint | Method | Description | Authentication | Role |
|----------|--------|-------------|----------------|------|
| `/get-courses` | GET | Lấy danh sách khóa học | No | - |
| `/get-course/:id` | GET | Lấy thông tin chi tiết khóa học | No | - |
| `/get-course-content/:id` | GET | Lấy nội dung khóa học | Yes | - |
| `/add-question` | PUT | Thêm câu hỏi vào khóa học | Yes | - |
| `/add-answer` | PUT | Thêm câu trả lời cho câu hỏi | Yes | - |
| `/add-review/:id` | PUT | Thêm đánh giá cho khóa học | Yes | - |
| `/add-reply` | PUT | Thêm trả lời cho đánh giá | Yes | - |
| `/get-transcript` | POST | Lấy transcript của video bài học | Yes | - |

### Admin Course Management

| Endpoint | Method | Description | Authentication | Role |
|----------|--------|-------------|----------------|------|
| `/create-course` | POST | Tạo khóa học mới | Yes | Admin |
| `/edit-course/:id` | PUT | Chỉnh sửa khóa học | Yes | Admin |
| `/get-admin-courses` | GET | Lấy danh sách khóa học (Admin) | Yes | Admin |
| `/get-course-content/:id` | GET | Lấy nội dung khóa học (Admin) | Yes | Admin |
| `/upload-course-video` | POST | Upload video cho khóa học | Yes | Admin |
| `/delete-course/:id` | DELETE | Xóa khóa học | Yes | Admin |
| `/generate-video-subtitle` | POST | Tạo phụ đề cho video | Yes | Admin |

## 3. Order API

Base path: `/api/v1`

### Order Management

| Endpoint | Method | Description | Authentication | Role |
|----------|--------|-------------|----------------|------|
| `/create-order` | POST | Tạo đơn hàng mới | Yes | - |
| `/get-all-orders` | GET | Lấy tất cả đơn hàng | Yes | Admin |
| `/get-user-orders` | GET | Lấy đơn hàng của người dùng hiện tại | Yes | - |
| `/create-payment` | POST | Tạo thanh toán Stripe | Yes | - |
| `/stripe-webhook` | POST | Webhook từ Stripe | No | - |

## 4. Notification API

Base path: `/api/v1`

### Notification Management

| Endpoint | Method | Description | Authentication | Role |
|----------|--------|-------------|----------------|------|
| `/get-all-notifications` | GET | Lấy tất cả thông báo (Admin) | Yes | Admin |
| `/get-user-notifications` | GET | Lấy thông báo của người dùng | Yes | - |
| `/update-notification/:id` | PUT | Cập nhật trạng thái thông báo | Yes | - |

## 5. Layout API

Base path: `/api/v1`

### Layout Management

| Endpoint | Method | Description | Authentication | Role |
|----------|--------|-------------|----------------|------|
| `/create-layout` | POST | Tạo layout mới | Yes | Admin |
| `/edit-layout` | PUT | Chỉnh sửa layout | Yes | Admin |
| `/get-layout/:type` | GET | Lấy layout theo loại | No | - |

## 6. Analytics API

Base path: `/api/v1`

### Analytics 

| Endpoint | Method | Description | Authentication | Role |
|----------|--------|-------------|----------------|------|
| `/get-users-analytics` | GET | Lấy thống kê người dùng | Yes | Admin |
| `/get-courses-analytics` | GET | Lấy thống kê khóa học | Yes | Admin |
| `/get-orders-analytics` | GET | Lấy thống kê đơn hàng | Yes | Admin |

## Chi tiết API Schemas

### 1. Authentication API

#### Registration User

```typescript
// POST /api/v1/registration
// Request
{
  name: string,
  email: string,
  password: string
}

// Response
{
  success: boolean,
  message: string,
  activationToken?: string
}
```

#### Activate User

```typescript
// POST /api/v1/activate-user
// Request
{
  activation_token: string,
  activation_code: string
}

// Response
{
  success: boolean,
  message: string,
  user?: IUser
}
```

#### Login User

```typescript
// POST /api/v1/login
// Request
{
  email: string,
  password: string
}

// Response
{
  success: boolean,
  accessToken?: string,
  user?: IUser,
  message?: string
}
```

### 2. Course API

#### Create Course

```typescript
// POST /api/v1/create-course
// Request
{
  name: string,
  description: string,
  price: number,
  estimatedPrice?: number,
  tags: string,
  level: string,
  demoUrl: string,
  categories: string,
  thumbnail?: File,
  benefits: { title: string }[],
  prerequisites: { title: string }[],
}

// Response
{
  success: boolean,
  course?: ICourse
}
```

#### Get Course Content

```typescript
// GET /api/v1/get-course-content/:id
// Response
{
  success: boolean,
  content?: ICourseData[],
  courseId?: string
}
```

### 3. Order API

#### Create Order

```typescript
// POST /api/v1/create-order
// Request
{
  courseId: string,
  payment_info: object // Stripe payment intent
}

// Response
{
  success: boolean,
  order?: IOrder
}
```

### 4. Layout API

#### Create Layout

```typescript
// POST /api/v1/create-layout
// Request
{
  type: "Banner" | "FAQ" | "Categories",
  banner?: {
    image: File,
    title: string,
    subTitle: string
  },
  faq?: { question: string, answer: string }[],
  categories?: { title: string }[]
}

// Response
{
  success: boolean,
  layout?: ILayout
}
```

## Authentication & Authorization

### Middleware

Hệ thống sử dụng hai middleware chính để bảo vệ các API:

1. **isAuthenticated**: Kiểm tra người dùng đã đăng nhập chưa
   - Xác thực thông qua JWT token trong cookie

2. **authorizeRoles**: Kiểm tra người dùng có quyền truy cập không
   - Ví dụ: `authorizeRoles("admin")` chỉ cho phép admin truy cập

### JWT Tokens

Hệ thống sử dụng hai loại token:

1. **Access Token**: Hết hạn sau 5 phút
2. **Refresh Token**: Hết hạn sau 3 ngày, được sử dụng để làm mới access token

## Realtime Notifications

### Socket.IO Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `connection` | Client -> Server | Client kết nối với Socket server |
| `notification` | Client -> Server | Gửi thông báo mới |
| `newNotification` | Server -> Client | Phát tín hiệu có thông báo mới |

## HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | OK - Request thành công |
| 201 | Created - Tài nguyên được tạo thành công |
| 400 | Bad Request - Request không hợp lệ |
| 401 | Unauthorized - Không có quyền truy cập |
| 404 | Not Found - Không tìm thấy tài nguyên |
| 500 | Internal Server Error - Lỗi server |