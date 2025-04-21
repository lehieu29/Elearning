# Quản Lý State (State Management)

Hệ thống E-Learning sử dụng Redux Toolkit và RTK Query để quản lý state và API calls. Dưới đây là phân tích chi tiết về cách quản lý state trong dự án.

## Cấu Trúc Redux

```
redux/
├── features/                 # Redux slices
│   ├── analytics/            # Analytics state
│   │   ├── analyticsApi.ts   # API cho analytics
│   │   └── analyticsSlice.ts # State cho analytics
│   ├── api/                  # Base API configuration
│   │   └── apiSlice.ts       # RTK Query setup
│   ├── auth/                 # Authentication state
│   │   ├── authApi.ts        # API cho authentication
│   │   └── authSlice.ts      # State cho authentication
│   ├── courses/              # Courses state
│   │   ├── coursesApi.ts     # API cho courses
│   │   └── coursesSlice.ts   # State cho courses
│   ├── layout/               # Layout state 
│   │   ├── layoutApi.ts      # API cho layout
│   │   └── layoutSlice.ts    # State cho layout
│   ├── notifications/        # Notifications state
│   │   ├── notificationsApi.ts # API cho notifications
│   │   └── notificationsSlice.ts # State cho notifications
│   ├── orders/               # Orders state
│   │   ├── ordersApi.ts      # API cho orders
│   │   └── ordersSlice.ts    # State cho orders
│   └── user/                 # User state
│       ├── userApi.ts        # API cho user
│       └── userSlice.ts      # State cho user
└── store.ts                  # Redux store configuration
```

## Redux Store

```typescript
// store.ts
import { configureStore } from "@reduxjs/toolkit";
import { apiSlice } from "./features/api/apiSlice";
import authReducer from "./features/auth/authSlice";
import userReducer from "./features/user/userSlice";
import coursesReducer from "./features/courses/coursesSlice";
import layoutReducer from "./features/layout/layoutSlice";
import notificationsReducer from "./features/notifications/notificationsSlice";
import ordersReducer from "./features/orders/ordersSlice";
import analyticsReducer from "./features/analytics/analyticsSlice";

export const store = configureStore({
  reducer: {
    [apiSlice.reducerPath]: apiSlice.reducer,
    auth: authReducer,
    user: userReducer,
    courses: coursesReducer,
    layout: layoutReducer,
    notifications: notificationsReducer,
    orders: ordersReducer,
    analytics: analyticsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(apiSlice.middleware),
  devTools: process.env.NODE_ENV !== "production",
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

## RTK Query Base Setup

```typescript
// features/api/apiSlice.ts
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { userLoggedIn } from "../auth/authSlice";

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_SERVER_URI,
  }),
  endpoints: (builder) => ({
    refreshToken: builder.query({
      query: (data) => ({
        url: "refresh",
        method: "GET",
        credentials: "include" as const,
      }),
    }),
    loadUser: builder.query({
      query: (data) => ({
        url: "me",
        method: "GET",
        credentials: "include" as const,
      }),
      async onQueryStarted(arg, { queryFulfilled, dispatch }) {
        try {
          const result = await queryFulfilled;
          dispatch(
            userLoggedIn({
              accessToken: result.data.accessToken,
              user: result.data.user,
            })
          );
        } catch (error: any) {
          console.log(error);
        }
      },
    }),
  }),
});

export const { useRefreshTokenQuery, useLoadUserQuery } = apiSlice;
```

## Các Slices Chính

### 1. Auth Slice

```typescript
// features/auth/authSlice.ts
import { PayloadAction, createSlice } from "@reduxjs/toolkit";

const initialState = {
  token: "",
  user: "",
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    userRegistration: (state, action: PayloadAction<{ token: string }>) => {
      state.token = action.payload.token;
    },
    userLoggedIn: (
      state,
      action: PayloadAction<{ accessToken: string; user: string }>
    ) => {
      state.token = action.payload.accessToken;
      state.user = action.payload.user;
    },
    userLoggedOut: (state) => {
      state.token = "";
      state.user = "";
    },
  },
});

export const { userRegistration, userLoggedIn, userLoggedOut } =
  authSlice.actions;

export default authSlice.reducer;
```

### 2. Auth API

```typescript
// features/auth/authApi.ts
import { apiSlice } from "../api/apiSlice";
import { userLoggedIn, userRegistration } from "./authSlice";

export const authApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    register: builder.mutation({
      query: (data) => ({
        url: "registration",
        method: "POST",
        body: data,
        credentials: "include" as const,
      }),
      async onQueryStarted(arg, { queryFulfilled, dispatch }) {
        try {
          const result = await queryFulfilled;
          dispatch(
            userRegistration({
              token: result.data.activationToken,
            })
          );
        } catch (error: any) {
          console.log(error);
        }
      },
    }),
    activation: builder.mutation({
      query: ({ activation_token, activation_code }) => ({
        url: "activate-user",
        method: "POST",
        body: {
          activation_token,
          activation_code,
        },
      }),
    }),
    login: builder.mutation({
      query: ({ email, password }) => ({
        url: "login",
        method: "POST",
        body: {
          email,
          password,
        },
        credentials: "include" as const,
      }),
      async onQueryStarted(arg, { queryFulfilled, dispatch }) {
        try {
          const result = await queryFulfilled;
          dispatch(
            userLoggedIn({
              accessToken: result.data.accessToken,
              user: result.data.user,
            })
          );
        } catch (error: any) {
          console.log(error);
        }
      },
    }),
    socialAuth: builder.mutation({
      query: ({ email, name, avatar }) => ({
        url: "social-auth",
        method: "POST",
        body: {
          email,
          name,
          avatar,
        },
        credentials: "include" as const,
      }),
      async onQueryStarted(arg, { queryFulfilled, dispatch }) {
        try {
          const result = await queryFulfilled;
          dispatch(
            userLoggedIn({
              accessToken: result.data.accessToken,
              user: result.data.user,
            })
          );
        } catch (error: any) {
          console.log(error);
        }
      },
    }),
    logOut: builder.query({
      query: () => ({
        url: "logout",
        method: "GET",
        credentials: "include" as const,
      }),
    }),
  }),
});

export const {
  useRegisterMutation,
  useActivationMutation,
  useLoginMutation,
  useSocialAuthMutation,
  useLogOutQuery,
} = authApi;
```

### 3. Courses Slice

```typescript
// features/courses/coursesSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface IInitialState {
  courses: any[];
  course: any;
}

const initialState: IInitialState = {
  courses: [],
  course: null,
};

const coursesSlice = createSlice({
  name: "courses",
  initialState,
  reducers: {
    setCourses: (state, action: PayloadAction<any[]>) => {
      state.courses = action.payload;
    },
    setCourse: (state, action: PayloadAction<any>) => {
      state.course = action.payload;
    },
    clearCourses: (state) => {
      state.courses = [];
      state.course = null;
    },
  },
});

export const { setCourses, setCourse, clearCourses } = coursesSlice.actions;
export default coursesSlice.reducer;
```

### 4. Courses API

```typescript
// features/courses/coursesApi.ts
import { apiSlice } from "../api/apiSlice";

export const coursesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createCourse: builder.mutation({
      query: (data) => ({
        url: "create-course",
        method: "POST",
        body: data,
        credentials: "include" as const,
      }),
    }),
    getAllCourses: builder.query({
      query: () => ({
        url: "get-courses",
        method: "GET",
        credentials: "include" as const,
      }),
    }),
    getCourseDetails: builder.query({
      query: (id) => ({
        url: `get-course/${id}`,
        method: "GET",
        credentials: "include" as const,
      }),
    }),
    getCourseContent: builder.query({
      query: (id) => ({
        url: `get-course-content/${id}`,
        method: "GET",
        credentials: "include" as const,
      }),
    }),
    addQuestion: builder.mutation({
      query: ({ question, courseId, contentId }) => ({
        url: "add-question",
        method: "PUT",
        body: { question, courseId, contentId },
        credentials: "include" as const,
      }),
    }),
    addAnswer: builder.mutation({
      query: ({ answer, courseId, contentId, questionId }) => ({
        url: "add-answer",
        method: "PUT",
        body: { answer, courseId, contentId, questionId },
        credentials: "include" as const,
      }),
    }),
    addReview: builder.mutation({
      query: ({ review, rating, courseId }) => ({
        url: `add-review/${courseId}`,
        method: "PUT",
        body: { review, rating },
        credentials: "include" as const,
      }),
    }),
    addReplyToReview: builder.mutation({
      query: ({ comment, courseId, reviewId }) => ({
        url: "add-reply",
        method: "PUT",
        body: { comment, courseId, reviewId },
        credentials: "include" as const,
      }),
    }),
    getTranscript: builder.mutation({
      query: ({ id, videoName }) => ({
        url: "get-transcript",
        method: "POST",
        body: { id, videoName },
        credentials: "include" as const,
      }),
    })
  }),
});

export const {
  useCreateCourseMutation,
  useGetAllCoursesQuery,
  useGetCourseDetailsQuery,
  useGetCourseContentQuery,
  useAddQuestionMutation,
  useAddAnswerMutation,
  useAddReviewMutation,
  useAddReplyToReviewMutation,
  useGetTranscriptMutation,
} = coursesApi;
```

### 5. Orders API

```typescript
// features/orders/ordersApi.ts
import { apiSlice } from "../api/apiSlice";

export const ordersApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createOrder: builder.mutation({
      query: (data) => ({
        url: "create-order",
        method: "POST",
        body: data,
        credentials: "include" as const,
      }),
    }),
    getOrders: builder.query({
      query: () => ({
        url: "get-user-orders",
        method: "GET",
        credentials: "include" as const,
      }),
    }),
    createPayment: builder.mutation({
      query: (data) => ({
        url: "create-payment",
        method: "POST",
        body: data,
        credentials: "include" as const,
      }),
    }),
  }),
});

export const {
  useCreateOrderMutation,
  useGetOrdersQuery,
  useCreatePaymentMutation,
} = ordersApi;
```

### 6. User API

```typescript
// features/user/userApi.ts
import { apiSlice } from "../api/apiSlice";

export const userApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    updateUserInfo: builder.mutation({
      query: (data) => ({
        url: "update-user-info",
        method: "PUT",
        body: data,
        credentials: "include" as const,
      }),
    }),
    updateUserPassword: builder.mutation({
      query: (data) => ({
        url: "update-user-password",
        method: "PUT",
        body: data,
        credentials: "include" as const,
      }),
    }),
    updateUserAvatar: builder.mutation({
      query: (data) => ({
        url: "update-user-avatar",
        method: "PUT",
        body: data,
        credentials: "include" as const,
      }),
    }),
    getAllUsers: builder.query({
      query: () => ({
        url: "get-users",
        method: "GET",
        credentials: "include" as const,
      }),
    }),
    updateUserRole: builder.mutation({
      query: (data) => ({
        url: "update-user",
        method: "PUT",
        body: data,
        credentials: "include" as const,
      }),
    }),
    deleteUser: builder.mutation({
      query: (id) => ({
        url: `delete-user/${id}`,
        method: "DELETE",
        credentials: "include" as const,
      }),
    }),
  }),
});

export const {
  useUpdateUserInfoMutation,
  useUpdateUserPasswordMutation,
  useUpdateUserAvatarMutation,
  useGetAllUsersQuery,
  useUpdateUserRoleMutation,
  useDeleteUserMutation,
} = userApi;
```

### 7. Layout API

```typescript
// features/layout/layoutApi.ts
import { apiSlice } from "../api/apiSlice";

export const layoutApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getHeroData: builder.query({
      query: () => ({
        url: "get-layout/Banner",
        method: "GET",
      }),
    }),
    getCategories: builder.query({
      query: () => ({
        url: "get-layout/Categories",
        method: "GET",
      }),
    }),
    getFaqs: builder.query({
      query: () => ({
        url: "get-layout/FAQ",
        method: "GET",
      }),
    }),
    createLayout: builder.mutation({
      query: (data) => ({
        url: "create-layout",
        method: "POST",
        body: data,
        credentials: "include" as const,
      }),
    }),
    editLayout: builder.mutation({
      query: (data) => ({
        url: "edit-layout",
        method: "PUT",
        body: data,
        credentials: "include" as const,
      }),
    }),
  }),
});

export const {
  useGetHeroDataQuery,
  useGetCategoriesQuery,
  useGetFaqsQuery,
  useCreateLayoutMutation,
  useEditLayoutMutation,
} = layoutApi;
```

### 8. Notifications API

```typescript
// features/notifications/notificationsApi.ts
import { apiSlice } from "../api/apiSlice";

export const notificationsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAllNotifications: builder.query({
      query: () => ({
        url: "get-all-notifications",
        method: "GET",
        credentials: "include" as const,
      }),
    }),
    getUserNotifications: builder.query({
      query: () => ({
        url: "get-user-notifications",
        method: "GET",
        credentials: "include" as const,
      }),
    }),
    updateNotification: builder.mutation({
      query: (id) => ({
        url: `update-notification/${id}`,
        method: "PUT",
        credentials: "include" as const,
      }),
    }),
  }),
});

export const {
  useGetAllNotificationsQuery,
  useGetUserNotificationsQuery,
  useUpdateNotificationMutation,
} = notificationsApi;
```

### 9. Analytics API

```typescript
// features/analytics/analyticsApi.ts
import { apiSlice } from "../api/apiSlice";

export const analyticsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getUsersAnalytics: builder.query({
      query: () => ({
        url: "get-users-analytics",
        method: "GET",
        credentials: "include" as const,
      }),
    }),
    getCoursesAnalytics: builder.query({
      query: () => ({
        url: "get-courses-analytics",
        method: "GET",
        credentials: "include" as const,
      }),
    }),
    getOrdersAnalytics: builder.query({
      query: () => ({
        url: "get-orders-analytics",
        method: "GET",
        credentials: "include" as const,
      }),
    }),
  }),
});

export const {
  useGetUsersAnalyticsQuery,
  useGetCoursesAnalyticsQuery,
  useGetOrdersAnalyticsQuery,
} = analyticsApi;
```

## Provider Setup

```typescript
// app/Provider.tsx
"use client";
import { store } from "@/redux/store";
import { Provider } from "react-redux";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <SessionProvider>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </SessionProvider>
    </Provider>
  );
}
```

## Sử Dụng Redux Trong Components

### Sử Dụng Redux State

```typescript
// Ví dụ: Trong component hiển thị Profile
"use client";
import React from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";

const ProfileInfo = () => {
  // Lấy state từ redux
  const { user } = useSelector((state: RootState) => state.auth);

  return (
    <div>
      <h2>{user.name}</h2>
      <p>{user.email}</p>
      {/* ... */}
    </div>
  );
};

export default ProfileInfo;
```

### Sử Dụng Redux Actions

```typescript
// Ví dụ: Trong component Logout
"use client";
import React from "react";
import { useDispatch } from "react-redux";
import { userLoggedOut } from "@/redux/features/auth/authSlice";
import { useLogOutQuery } from "@/redux/features/auth/authApi";

const LogoutButton = () => {
  const dispatch = useDispatch();
  const { refetch } = useLogOutQuery(undefined, {
    skip: true,
  });

  const handleLogout = async () => {
    await refetch();
    dispatch(userLoggedOut());
  };

  return <button onClick={handleLogout}>Đăng xuất</button>;
};

export default LogoutButton;
```

### Sử Dụng RTK Query

```typescript
// Ví dụ: Trong component CourseList
"use client";
import React from "react";
import { useGetAllCoursesQuery } from "@/redux/features/courses/coursesApi";
import CourseCard from "./CourseCard";
import Loader from "../Loader/Loader";

const CourseList = () => {
  const { data, isLoading, error } = useGetAllCoursesQuery(undefined);

  if (isLoading) return <Loader />;

  if (error) return <div>Đã xảy ra lỗi khi tải khóa học</div>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {data?.courses.map((course: any) => (
        <CourseCard key={course._id} course={course} />
      ))}
    </div>
  );
};

export default CourseList;
```

## Cache Management

RTK Query tự động quản lý cache cho các API calls, với các cơ chế như:

1. **Cache Invalidation**: Tự động làm mới cache khi có mutation
2. **Refetching**: Tự động làm mới dữ liệu khi cần
3. **Polling**: Tự động truy vấn lại dữ liệu theo khoảng thời gian

```typescript
// Ví dụ: Cache invalidation khi thêm khóa học mới
export const coursesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createCourse: builder.mutation({
      query: (data) => ({
        url: "create-course",
        method: "POST",
        body: data,
        credentials: "include" as const,
      }),
      // Làm mới cache khi tạo khóa học mới
      invalidatesTags: ["Courses"],
    }),
    getAllCourses: builder.query({
      query: () => ({
        url: "get-courses",
        method: "GET",
        credentials: "include" as const,
      }),
      // Đánh dấu cache với tag
      providesTags: ["Courses"],
    }),
  }),
});
```

## Socket.IO Integration với Redux

```typescript
// Trong component sử dụng Socket.IO
"use client";
import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { addNotification } from "@/redux/features/notifications/notificationsSlice";
import socketIO from "socket.io-client";

const ENDPOINT = process.env.NEXT_PUBLIC_SOCKET_SERVER_URI || "";
const socket = socketIO(ENDPOINT, { transports: ["websocket"] });

const NotificationListener = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    // Lắng nghe sự kiện socket
    socket.on("newNotification", (data) => {
      // Thêm thông báo mới vào Redux store
      dispatch(addNotification(data));
    });

    return () => {
      // Dọn dẹp khi unmount
      socket.off("newNotification");
    };
  }, [dispatch]);

  return null; // Component không render gì
};

export default NotificationListener;
```

## Custom Hooks Redux

```typescript
// hooks/useAuth.ts
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";

export const useAuth = () => {
  const { user, token } = useSelector((state: RootState) => state.auth);
  
  const isAuthenticated = !!token;
  const isAdmin = user?.role === "admin";
  
  return {
    user,
    token,
    isAuthenticated,
    isAdmin,
  };
};

// Sử dụng trong component
const MyComponent = () => {
  const { isAuthenticated, isAdmin } = useAuth();
  
  if (!isAuthenticated) {
    return <p>Vui lòng đăng nhập</p>;
  }
  
  return (
    <div>
      {isAdmin && <AdminPanel />}
      <UserContent />
    </div>
  );
};
```

## Status Loading và Error Handling

```typescript
// Ví dụ: Loading và Error Handling với RTK Query
"use client";
import React from "react";
import { useLoginMutation } from "@/redux/features/auth/authApi";
import toast from "react-hot-toast";

const LoginForm = () => {
  const [login, { isLoading, error }] = useLoginMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      await login({ email, password }).unwrap();
      toast.success("Đăng nhập thành công");
    } catch (err) {
      toast.error(err.data?.message || "Đăng nhập thất bại");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button type="submit" disabled={isLoading}>
        {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
      </button>
      {error && (
        <p className="text-red-500">
          {error.data?.message || "Đăng nhập thất bại"}
        </p>
      )}
    </form>
  );
};
```

## TypeScript Integration

```typescript
// Định nghĩa types cho state
// types/redux.ts
export interface User {
  _id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  avatar: {
    public_id: string;
    url: string;
  };
  courses: Array<{ courseId: string }>;
  isVerified: boolean;
  createdAt: string;
}

export interface AuthState {
  token: string;
  user: User | null;
}

export interface Course {
  _id: string;
  name: string;
  description: string;
  price: number;
  estimatedPrice?: number;
  thumbnail: {
    public_id: string;
    url: string;
  };
  tags: string;
  level: string;
  demoUrl: string;
  benefits: Array<{ title: string }>;
  prerequisites: Array<{ title: string }>;
  reviews: Array<Review>;
  courseData: Array<CourseData>;
  ratings?: number;
  purchased: number;
  createdAt: string;
}

// Sử dụng types trong slices
// features/auth/authSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AuthState, User } from "@/types/redux";

const initialState: AuthState = {
  token: "",
  user: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    userLoggedIn: (
      state,
      action: PayloadAction<{ accessToken: string; user: User }>
    ) => {
      state.token = action.payload.accessToken;
      state.user = action.payload.user;
    },
    // ...other reducers
  },
});
```

## Tích Hợp với NextAuth

```typescript
// pages/api/auth/[...nextauth].ts
import NextAuth from "next-auth";
import { authApi } from "@/redux/features/auth/authApi";
import { store } from "@/redux/store";
import { userLoggedIn } from "@/redux/features/auth/authSlice";

export default NextAuth({
  // ... NextAuth config
  callbacks: {
    async jwt({ token, user, account }) {
      if (user && account?.type === "credentials") {
        // JWT from credentials
        token.accessToken = user.accessToken;
        token.user = user;
      } else if (user && account?.type === "oauth") {
        // Handle social login
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URI}/social-auth`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: user.email,
              name: user.name,
              avatar: user.image,
            }),
          });
          
          const data = await response.json();
          
          if (data.success) {
            // Update Redux store
            store.dispatch(
              userLoggedIn({
                accessToken: data.accessToken,
                user: data.user,
              })
            );
            
            // Update token
            token.accessToken = data.accessToken;
            token.user = data.user;
          }
        } catch (error) {
          console.error("Social auth error:", error);
        }
      }
      
      return token;
    },
    async session({ session, token }) {
      session.user = token.user;
      session.accessToken = token.accessToken;
      return session;
    },
  },
});
```

## Kiểm Tra Auth trong Layout hoặc Page

```typescript
// app/layout.tsx
import { Providers } from "./Provider";
import AuthCheck from "./components/Auth/AuthCheck";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <AuthCheck>{children}</AuthCheck>
        </Providers>
      </body>
    </html>
  );
}

// app/components/Auth/AuthCheck.tsx
"use client";
import { useLoadUserQuery } from "@/redux/features/api/apiSlice";
import { useSelector } from "react-redux";
import React, { useEffect } from "react";
import Loader from "../Loader/Loader";

export default function AuthCheck({
  children,
}: {
  children: React.ReactNode;
}) {
  const { token } = useSelector((state: any) => state.auth);
  const { isLoading } = useLoadUserQuery(undefined, {
    skip: !token,
  });

  if (isLoading) {
    return <Loader />;
  }

  return <>{children}</>;
}
```

## Phân Quyền Trong Redux

```typescript
// app/components/Admin/AdminCheck.tsx
"use client";
import { useAuth } from "@/hooks/useAuth";
import { redirect } from "next/navigation";
import React from "react";

export default function AdminCheck({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isAdmin } = useAuth();

  if (!isAuthenticated) {
    redirect("/login");
  }

  if (!isAdmin) {
    redirect("/");
  }

  return <>{children}</>;
}

// app/admin/layout.tsx
import AdminCheck from "../components/Admin/AdminCheck";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminCheck>
      <div className="admin-layout">{children}</div>
    </AdminCheck>
  );
}
```