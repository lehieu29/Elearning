# Module: redux/

## Purpose
The `redux/` directory manages the global state of the application using Redux Toolkit. It provides slices and APIs for handling various features like authentication, courses, analytics, and notifications.

## Structure & Logic
1. **Store**:
   - **`store.ts`**: Configures the Redux store and integrates slices.

2. **Features**:
   - **`analytics/`**: Handles analytics-related state and API calls (`analyticsApi.ts`).
   - **`api/`**: Manages generic API interactions (`apiSlice.ts`).
   - **`auth/`**: Manages authentication state and API calls (`authApi.ts`, `authSlice.ts`).
   - **`courses/`**: Handles course-related state and API calls (`coursesApi.tsx`).
   - **`layout/`**: Manages layout-related state and API calls (`layoutApi.ts`).
   - **`notifications/`**: Handles notifications state and API calls (`notificationsApi.ts`).
   - **`orders/`**: Manages order-related state and API calls (`ordersApi.ts`).
   - **`user/`**: Handles user-related state and API calls (`userApi.ts`).

## Related Files
- **`store.ts`**: Centralized configuration for Redux store.
- **Feature Slices**: Each feature directory contains its own slice and API logic.

## Notes
- The `redux/` directory is well-organized, with each feature having its own directory for modular state management.
- Redux Toolkit simplifies state management with built-in support for slices and middleware.
- API slices use `createApi` for efficient data fetching and caching.
