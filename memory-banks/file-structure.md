# Cấu Trúc Thư Mục Dự Án E-Learning

Dự án E-Learning được phân chia thành 2 phần chính: Frontend và Backend. Dưới đây là mô tả chi tiết về cấu trúc thư mục và vai trò của mỗi thành phần.

## Cấu Trúc Gốc

```
D:/Project/Elearning/
├── .git/                  # Git repository
├── action.md              # File ghi chú hành động
├── Backend/               # Mã nguồn backend
├── courses.json           # Dữ liệu mẫu khóa học
├── Frontend/              # Mã nguồn frontend
├── memory-banks/          # Thư mục lưu trữ kiến thức dự án
├── project-knowledge.md   # Thông tin tổng quan về dự án
├── README.md              # Tài liệu dự án
└── structure.txt          # Mô tả cấu trúc dự án
```

## Backend

```
Backend/
├── @types/                # Type definitions cho TypeScript
├── controller/            # Xử lý logic nghiệp vụ
│   ├── analytics.controller.ts   # Xử lý thống kê
│   ├── course.controller.ts      # Xử lý khóa học
│   ├── layout.controller.ts      # Xử lý layout
│   ├── notification.controller.ts # Xử lý thông báo
│   ├── order.controller.ts       # Xử lý đơn hàng
│   └── user.controller.ts        # Xử lý người dùng
├── mails/                 # Templates cho email
├── middleware/            # Middleware
│   ├── auth.ts            # Authentication middleware
│   ├── catchAsyncErrors.ts # Error handling middleware
│   └── error.ts           # Error handling middleware
├── models/                # MongoDB schemas
│   ├── ai.model.ts        # Model cho dữ liệu AI
│   ├── course.model.ts    # Model cho khóa học
│   ├── layout.model.ts    # Model cho layout
│   ├── notification.model.ts # Model cho thông báo
│   ├── order.model.ts     # Model cho đơn hàng
│   ├── subtitle.model.ts  # Model cho phụ đề
│   └── user.model.ts      # Model cho người dùng
├── routes/                # API routes
│   ├── analytics.route.ts # Routes thống kê
│   ├── course.route.ts    # Routes khóa học
│   ├── layout.route.ts    # Routes layout
│   ├── notification.route.ts # Routes thông báo
│   ├── order.route.ts     # Routes đơn hàng
│   └── user.route.ts      # Routes người dùng
├── services/              # Business logic services
├── uploads/               # Thư mục tạm cho upload files
├── utils/                 # Utility functions
│   ├── ErrorHandler.ts    # Custom error handler
│   ├── jwt.ts             # JWT utilities
│   ├── redis.ts           # Redis configuration
│   └── sendMail.ts        # Email sending utility
├── .env                   # Environment variables
├── .env.example           # Template cho .env
├── .gitignore             # Git ignore rules
├── app.ts                 # Express application setup
├── package.json           # Dependencies và scripts
├── package-lock.json      # Lock file cho dependencies
├── README.md              # Tài liệu backend
├── server.ts              # Server entry point
├── socketServer.ts        # Socket.IO server
└── tsconfig.json          # TypeScript configuration
```

### Vai Trò Các Thư Mục Backend

1. **@types/**: Chứa các định nghĩa TypeScript, đặc biệt là các interface mở rộng cho các object như Request của Express để thêm trường user.

2. **controller/**: Chứa các controller xử lý logic nghiệp vụ cho từng đối tượng:
   - **analytics.controller.ts**: Xử lý các yêu cầu thống kê và phân tích dữ liệu
   - **course.controller.ts**: Quản lý thao tác CRUD với khóa học
   - **layout.controller.ts**: Quản lý layout giao diện như banner, FAQs
   - **notification.controller.ts**: Xử lý thông báo
   - **order.controller.ts**: Quản lý đơn hàng và thanh toán
   - **user.controller.ts**: Xử lý đăng ký, đăng nhập, quản lý người dùng

3. **mails/**: Chứa các template EJS cho email như:
   - Xác thực tài khoản
   - Đặt lại mật khẩu
   - Thông báo đơn hàng
   - Email thông báo

4. **middleware/**: Chứa các middleware:
   - **auth.ts**: Middleware xác thực JWT và phân quyền
   - **catchAsyncErrors.ts**: Bắt lỗi cho async functions
   - **error.ts**: Xử lý và định dạng lỗi

5. **models/**: Định nghĩa schema Mongoose:
   - **ai.model.ts**: Dữ liệu AI
   - **course.model.ts**: Khóa học với các trường như name, description, courseData
   - **layout.model.ts**: Layout giao diện như banner, FAQ
   - **notification.model.ts**: Thông báo
   - **order.model.ts**: Đơn hàng và thanh toán
   - **subtitle.model.ts**: Phụ đề cho video
   - **user.model.ts**: Người dùng với các phương thức authentication

6. **routes/**: Định nghĩa API routes:
   - **analytics.route.ts**: Routes thống kê
   - **course.route.ts**: Routes quản lý khóa học
   - **layout.route.ts**: Routes quản lý layout
   - **notification.route.ts**: Routes quản lý thông báo
   - **order.route.ts**: Routes quản lý đơn hàng
   - **user.route.ts**: Routes xác thực và quản lý người dùng

7. **services/**: Chứa logic nghiệp vụ phức tạp:
   - Xử lý AI
   - Xử lý Email
   - Xử lý đơn hàng
   - ...

8. **uploads/**: Thư mục tạm để lưu file upload trước khi đẩy lên Cloudinary

9. **utils/**: Các hàm tiện ích:
   - **ErrorHandler.ts**: Custom error class
   - **jwt.ts**: Utilities cho JWT
   - **redis.ts**: Cấu hình Redis (nếu có)
   - **sendMail.ts**: Hàm gửi email với Nodemailer

10. **app.ts**: Cấu hình Express application
11. **server.ts**: Entry point của ứng dụng
12. **socketServer.ts**: Cấu hình Socket.IO cho realtime notifications

## Frontend

```
Frontend/
├── app/                  # Next.js App Router
│   ├── about/            # Trang giới thiệu
│   ├── admin/            # Các trang dành cho admin
│   │   ├── courses/      # Quản lý khóa học (admin)
│   │   ├── dashboard/    # Dashboard admin
│   │   ├── orders/       # Quản lý đơn hàng
│   │   ├── users/        # Quản lý người dùng
│   │   ├── layout.tsx    # Layout cho admin pages
│   │   └── page.tsx      # Admin home page
│   ├── components/       # Các components
│   │   ├── Admin/        # Components cho admin
│   │   ├── AI/           # Components AI chat
│   │   ├── Auth/         # Components xác thực
│   │   ├── Course/       # Components khóa học
│   │   ├── FAQ/          # Components FAQ
│   │   ├── Footer.tsx    # Footer component
│   │   ├── Header.tsx    # Header component
│   │   ├── Loader/       # Loading components
│   │   ├── Payment/      # Components thanh toán
│   │   ├── Profile/      # Components profile
│   │   ├── Review/       # Components đánh giá
│   │   └── Route/        # Protected route components
│   ├── course/           # Trang chi tiết khóa học
│   ├── course-access/    # Trang truy cập nội dung khóa học
│   ├── courses/          # Trang danh sách khóa học
│   ├── faq/              # Trang FAQ
│   ├── hooks/            # Custom React hooks
│   ├── policy/           # Trang chính sách
│   ├── profile/          # Trang quản lý hồ sơ
│   ├── styles/           # CSS styles
│   ├── utils/            # Utility functions
│   ├── favicon.ico       # Favicon
│   ├── globals.css       # Global CSS
│   ├── layout.tsx        # Root layout
│   ├── page.tsx          # Home page
│   └── Provider.tsx      # Provider cho Redux và theme
├── pages/                # Next.js Pages Router
│   └── api/              # API routes cho Next.js
├── public/               # Public assets
│   ├── assets/           # Images và media
│   └── favicon.ico       # Favicon
├── redux/                # Redux state management
│   ├── features/         # Redux slices
│   │   ├── analytics/    # Analytics slice
│   │   ├── api/          # API slice (RTK Query)
│   │   ├── auth/         # Authentication slice
│   │   ├── courses/      # Courses slice
│   │   ├── layout/       # Layout slice
│   │   ├── notifications/# Notifications slice
│   │   ├── orders/       # Orders slice
│   │   └── user/         # User slice
│   └── store.ts          # Redux store configuration
├── .env                  # Environment variables
├── .env.example          # Template cho .env
├── .eslintrc.json        # ESLint configuration
├── .gitignore            # Git ignore rules
├── next.config.mjs       # Next.js configuration
├── package.json          # Dependencies và scripts
├── package-lock.json     # Lock file cho dependencies
├── postcss.config.js     # PostCSS configuration
├── README.md             # Frontend documentation
├── tailwind.config.ts    # Tailwind CSS configuration
└── tsconfig.json         # TypeScript configuration
```

### Vai Trò Các Thư Mục Frontend

1. **app/**: Thư mục chính của Next.js App Router:
   - **about/**: Trang giới thiệu
   - **admin/**: Khu vực admin
   - **components/**: React components
   - **course/**: Trang chi tiết khóa học
   - **course-access/**: Trang xem nội dung khóa học
   - **courses/**: Trang danh sách khóa học
   - **faq/**: Trang câu hỏi thường gặp
   - **hooks/**: Custom React hooks
   - **policy/**: Trang chính sách
   - **profile/**: Trang quản lý hồ sơ
   - **styles/**: CSS styles
   - **utils/**: Utility functions
   - **layout.tsx**: Root layout cho toàn bộ ứng dụng
   - **page.tsx**: Home page
   - **Provider.tsx**: Provider cho Redux và theme

2. **app/components/**: Các React components:
   - **Admin/**: Components cho admin panel
   - **AI/**: Components liên quan đến AI chat
   - **Auth/**: Components xác thực (login, register)
   - **Course/**: Components hiển thị khóa học
   - **FAQ/**: Components FAQ
   - **Loader/**: Components loading
   - **Payment/**: Components thanh toán
   - **Profile/**: Components quản lý hồ sơ
   - **Review/**: Components đánh giá
   - **Route/**: Protected route components

3. **pages/**: Next.js Pages Router (cũ):
   - **api/**: API routes của Next.js
   - **_app.tsx**: Custom App component
   - **_document.tsx**: Custom Document component
   - **auth/[...nextauth].ts**: NextAuth configuration

4. **public/**: Assets tĩnh:
   - **assets/**: Hình ảnh và media files
   - **favicon.ico**: Favicon của website

5. **redux/**: State management:
   - **features/**: Redux slices và API endpoints
   - **store.ts**: Redux store configuration

6. **redux/features/**: Redux slices:
   - **analytics/**: Quản lý state cho analytics
   - **api/**: RTK Query API endpoints
   - **auth/**: Quản lý state cho authentication
   - **courses/**: Quản lý state cho courses
   - **layout/**: Quản lý state cho layout UI
   - **notifications/**: Quản lý state cho notifications
   - **orders/**: Quản lý state cho orders
   - **user/**: Quản lý state cho user info

## File Cấu Hình

### Backend Config Files
- **.env**: Environment variables
  ```
  PORT=8000
  ORIGIN=["http://localhost:3000"]
  NODE_ENV=development
  DB_URL=mongodb://127.0.0.1:27017/Elearning
  CLOUD_NAME=your_cloudinary_name
  CLOUD_API_KEY=your_cloudinary_api_key
  CLOUD_SECRET_KEY=your_cloudinary_secret
  REDIS_URL=redis://localhost:6379
  ACTIVATION_SECRET=activation_secret
  ACCESS_TOKEN=access_token_secret
  REFRESH_TOKEN=refresh_token_secret
  ACCESS_TOKEN_EXPIRE=5
  REFRESH_TOKEN_EXPIRE=3
  SMTP_HOST=smtp.gmail.com
  SMTP_PORT=465
  SMTP_SERVICE=gmail
  SMTP_MAIL=example@gmail.com
  SMTP_PASSWORD=app_password
  STRIPE_SECRET_KEY=your_stripe_secret
  STRIPE_PUBLISHABLE_KEY=your_stripe_publishable
  GEMINI_API_KEY=your_gemini_api_key
  ```

- **tsconfig.json**: TypeScript configuration

### Frontend Config Files
- **.env**: Environment variables
  ```
  NEXT_PUBLIC_SERVER_URI=http://localhost:8000/api/v1
  NEXT_PUBLIC_SOCKET_SERVER_URI=http://localhost:8000
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable
  NEXTAUTH_SECRET=your_nextauth_secret
  GOOGLE_CLIENT_ID=your_google_client_id
  GOOGLE_CLIENT_SECRET=your_google_client_secret
  GITHUB_CLIENT_ID=your_github_client_id
  GITHUB_CLIENT_SECRET=your_github_client_secret
  ```

- **next.config.mjs**: Next.js configuration
- **tailwind.config.ts**: Tailwind CSS configuration
- **postcss.config.js**: PostCSS configuration
- **tsconfig.json**: TypeScript configuration

## File Structure Patterns

1. **MVC Pattern (Backend)**:
   - **Model**: Mongoose schemas trong /models
   - **View**: Frontend (Next.js) 
   - **Controller**: Logic xử lý trong /controller

2. **Feature-based Structure (Frontend)**:
   - Components được tổ chức theo tính năng
   - Redux slices được tổ chức theo tính năng

3. **Middleware Pattern (Backend)**:
   - Các middleware được chuỗi lại để xử lý request

4. **Repository Pattern (Backend)**:
   - Models cung cấp interface để tương tác với database

5. **Service Layer Pattern (Backend)**:
   - Đặt logic phức tạp trong services

## Quy Ước Đặt Tên

### Backend
- **File Naming**: Kebab-case cho file (ví dụ: user-controller.ts)
- **Class Naming**: PascalCase (ví dụ: UserController, ErrorHandler)
- **Interface Naming**: PascalCase với prefix 'I' (ví dụ: IUser, ICourse)
- **Function Naming**: camelCase (ví dụ: getUserById, createCourse)
- **Variable Naming**: camelCase (ví dụ: userId, courseData)
- **Constant Naming**: UPPER_SNAKE_CASE hoặc camelCase (ví dụ: PORT, apiUrl)

### Frontend
- **Component Naming**: PascalCase (ví dụ: CourseCard, UserProfile)
- **Hook Naming**: camelCase với prefix 'use' (ví dụ: useAuth, useCourses)
- **State Naming**: camelCase (ví dụ: isLoading, userData)
- **Event Handler Naming**: camelCase với prefix 'handle' (ví dụ: handleSubmit)
- **File Naming**: PascalCase cho component files (CourseCard.tsx)
- **Redux Slice Naming**: camelCase (ví dụ: authSlice, coursesSlice)

## Relationships Between Files

### Backend
1. **Models & Controllers**:
   - Controllers sử dụng models để CRUD dữ liệu
   - Ví dụ: `user.controller.ts` sử dụng `user.model.ts`

2. **Controllers & Routes**:
   - Routes định nghĩa endpoints và liên kết với controllers
   - Ví dụ: `user.route.ts` sử dụng functions từ `user.controller.ts`

3. **Middleware & Routes**:
   - Routes áp dụng middleware như authentication
   - Ví dụ: `isAuthenticated` middleware được áp dụng trong `user.route.ts`

4. **Utils & Controllers**:
   - Controllers sử dụng utility functions
   - Ví dụ: `user.controller.ts` sử dụng `sendMail.ts`

### Frontend
1. **Redux & Components**:
   - Components sử dụng Redux hooks để access state
   - Ví dụ: Course component sử dụng coursesSlice

2. **API Slices & Components**:
   - Components gọi API thông qua RTK Query hooks
   - Ví dụ: Login component sử dụng useLoginMutation

3. **Layouts & Pages**:
   - Pages sử dụng layouts để cấu trúc UI
   - Ví dụ: Admin pages sử dụng AdminLayout

4. **Protected Routes & Pages**:
   - Protected route components wrap các pages cần authentication
   - Ví dụ: ProfilePage được wrap bởi ProtectedRoute