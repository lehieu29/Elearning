# Frontend E-Learning

Frontend của hệ thống E-Learning được xây dựng trên Next.js với TypeScript, cung cấp giao diện người dùng hiện đại và đầy đủ tính năng.

## Công Nghệ & Thư Viện

### Framework & Language
- **Next.js**: Framework React cho SSR và SSG
- **TypeScript**: Ngôn ngữ lập trình tĩnh kiểu
- **React**: Thư viện UI

### State Management
- **Redux Toolkit**: Quản lý state toàn cục
- **RTK Query**: Data fetching & caching

### Styling
- **Tailwind CSS**: Framework CSS utility-first
- **Material UI**: Thư viện component React
- **Emotion**: CSS-in-JS

### Authentication
- **NextAuth.js**: Xác thực người dùng

### Form Handling
- **Formik**: Quản lý form
- **Yup**: Validation schema

### Payments
- **Stripe**: Tích hợp thanh toán

### Charts & Data
- **Recharts**: Biểu đồ và trực quan hóa dữ liệu
- **MUI X Data Grid**: Hiển thị và quản lý dữ liệu dạng bảng

### Notifications
- **React Hot Toast**: Thông báo toast
- **Socket.IO Client**: Thông báo realtime

### AI Integration
- **Google Generative AI**: Tích hợp trí tuệ nhân tạo

## Cấu Trúc Thư Mục

```
Frontend/
│
├── app/                  # Ứng dụng Next.js App Router
│   ├── about/            # Trang About
│   ├── admin/            # Trang quản trị
│   ├── components/       # Components tái sử dụng
│   ├── course/           # Trang chi tiết khóa học
│   ├── course-access/    # Trang truy cập khóa học
│   ├── courses/          # Trang danh sách khóa học
│   ├── faq/              # Trang FAQ
│   ├── globals.css       # CSS toàn cục
│   ├── layout.tsx        # Layout chung
│   ├── page.tsx          # Trang chủ
│   ├── profile/          # Trang hồ sơ người dùng
│   ├── Provider.tsx      # Provider Redux và theme
│   ├── styles/           # Styles và theme
│   └── utils/            # Các hàm tiện ích
│
├── pages/                # Pages API cho NextAuth
│   └── api/              # API routes
│
├── public/               # Assets tĩnh
│
├── redux/                # State management
│   ├── features/         # Redux features/slices
│   │   ├── analytics/    # Analytics slice & API
│   │   ├── api/          # Base API configuration
│   │   ├── auth/         # Authentication slice & API
│   │   ├── courses/      # Courses slice & API
│   │   ├── layout/       # Layout slice & API
│   │   ├── notifications/# Notifications slice & API
│   │   ├── orders/       # Orders slice & API
│   │   └── user/         # User slice & API
│   └── store.ts          # Redux store configuration
│
├── .env                  # Environment variables (local)
├── .env.example          # Example environment variables
├── next.config.mjs       # Next.js configuration
├── package.json          # Dependencies
└── tsconfig.json         # TypeScript configuration
```

## Luồng Xử Lý Chính

### 1. Routing & Navigation

Dự án sử dụng App Router của Next.js:

- **app/page.tsx**: Trang chủ
- **app/about/page.tsx**: Trang giới thiệu
- **app/course/[id]/page.tsx**: Trang chi tiết khóa học
- **app/courses/page.tsx**: Trang danh sách khóa học
- **app/course-access/[id]/page.tsx**: Trang xem nội dung khóa học
- **app/profile/page.tsx**: Trang hồ sơ người dùng
- **app/admin/...**: Các trang quản trị

### 2. State Management & Data Flow

```
┌───────────────────┐     ┌───────────────────┐
│                   │     │                   │
│  Redux Store      │     │  API Middleware   │
│  (store.ts)       │◄────┤  (RTK Query)      │
│                   │     │                   │
└─────────┬─────────┘     └─────────▲─────────┘
          │                         │
          │                         │
          │                         │
┌─────────▼─────────┐     ┌─────────┴─────────┐
│                   │     │                   │
│  React Components │─────►  Backend Server   │
│                   │     │                   │
└───────────────────┘     └───────────────────┘
```

#### Redux Flow:

1. **Slices**: Redux Toolkit slices trong thư mục `/redux/features/`
2. **Store**: Cấu hình trong `/redux/store.ts`
3. **API**: RTK Query API slices cho data fetching
4. **Components**: Sử dụng hooks `useSelector` và `useDispatch`

### 3. Authentication Flow

```
┌───────────┐     ┌───────────┐     ┌───────────┐
│           │     │           │     │           │
│  Login/   │────►│ NextAuth  │────►│ Backend   │
│  Register │     │ Provider  │     │ API       │
│           │     │           │     │           │
└───────────┘     └─────┬─────┘     └─────┬─────┘
                        │                 │
                  ┌─────▼─────┐     ┌─────▼─────┐
                  │           │     │           │
                  │ Session   │◄────┤ JWT Token │
                  │ Cookie    │     │           │
                  │           │     │           │
                  └─────┬─────┘     └───────────┘
                        │
                        │
                  ┌─────▼─────┐
                  │           │
                  │ Protected │
                  │ Routes    │
                  │           │
                  └───────────┘
```

### 4. API Interactions

Dự án sử dụng RTK Query trong Redux Toolkit để giao tiếp với Backend:

```typescript
// Ví dụ API slice
export const coursesApi = createApi({
  reducerPath: 'coursesApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api/v1' }),
  endpoints: (builder) => ({
    getCourses: builder.query({
      query: () => 'courses',
    }),
    getCourseById: builder.query({
      query: (id) => `courses/${id}`,
    }),
    // ...các endpoints khác
  }),
});

// Hooks được tạo tự động
export const { useGetCoursesQuery, useGetCourseByIdQuery } = coursesApi;
```

### 5. Thanh Toán Với Stripe

```
┌───────────┐     ┌───────────┐     ┌───────────┐
│           │     │           │     │           │
│  Checkout │────►│ Stripe.js │────►│ Stripe    │
│  Form     │     │ Frontend  │     │ API       │
│           │     │           │     │           │
└───────────┘     └─────┬─────┘     └─────┬─────┘
                        │                 │
                        │                 │
                  ┌─────▼─────┐     ┌─────▼─────┐
                  │           │     │           │
                  │ Backend   │────►│ Database  │
                  │ API       │     │ (Order)   │
                  │           │     │           │
                  └───────────┘     └───────────┘
```

### 6. Tích Hợp AI

```
┌───────────┐     ┌───────────┐     ┌───────────┐
│           │     │           │     │           │
│  AI Chat  │────►│ Google    │────►│ AI        │
│  Component│     │ Gen AI    │     │ Response  │
│           │     │ SDK       │     │           │
└───────────┘     └───────────┘     └───────────┘
```

## Tương Tác Với Backend

### API Endpoints Chính

| Endpoint                 | Phương Thức | Mô Tả                                   |
|--------------------------|-------------|------------------------------------------|
| `/api/v1/auth/login`     | POST        | Đăng nhập                               |
| `/api/v1/auth/register`  | POST        | Đăng ký                                 |
| `/api/v1/courses`        | GET         | Lấy danh sách khóa học                  |
| `/api/v1/courses/:id`    | GET         | Lấy thông tin chi tiết khóa học         |
| `/api/v1/orders/create`  | POST        | Tạo đơn hàng mới                        |
| `/api/v1/user/me`        | GET         | Lấy thông tin người dùng hiện tại       |
| `/api/v1/analytics`      | GET         | Lấy dữ liệu phân tích (Admin)           |

### Authentication

Frontend sử dụng NextAuth.js để quản lý xác thực:

```typescript
// pages/api/auth/[...nextauth].ts
export default NextAuth({
  providers: [
    CredentialsProvider({
      // Xác thực thông qua API backend
    }),
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      // Xử lý JWT token
    },
    session: async ({ session, token }) => {
      // Cấu hình session
    },
  },
  // ...các cấu hình khác
});
```

## Khởi Động Dự Án

1. **Cài đặt dependencies**
   ```bash
   npm install
   ```

2. **Cấu hình biến môi trường**
   - Tạo file `.env.local` từ `.env.example`
   - Cập nhật các giá trị cần thiết

3. **Chạy development server**
   ```bash
   npm run dev
   ```

4. **Build cho production**
   ```bash
   npm run build
   npm start
   ```

## Cấu Trúc Component Chính

- **Layout**: Cấu trúc chung, bao gồm Header và Footer
- **Auth Components**: Login, SignUp cho xác thực
- **Course Components**: CourseCard, CourseContent, CoursePlayer
- **Admin Components**: Dashboard, Analytics, CourseForm
- **AI Components**: AiChat cho tương tác AI
- **Payment Components**: CheckoutForm cho thanh toán