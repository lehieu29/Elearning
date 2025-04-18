# Application and Routes: Elearning Website Backend

## Application Setup
- **File**: `app.ts`
- **Framework**: Express.js
- **Configuration**:
  - Parses JSON requests with a size limit of 50MB.
  - Uses `cookie-parser` for handling cookies.
  - Configures CORS to allow requests from `http://localhost:3000` with credentials.
  - Registers API routes under the `/api/v1` prefix.
  - Handles unknown routes with a 404 error.
  - Applies a global error-handling middleware (`ErrorMiddleware`).

## Routes
- **Base Path**: `/api/v1`
- **Defined Routes**:
  1. **User Management**: `user.route.ts`
  2. **Course Management**: `course.route.ts`
  3. **Order Processing**: `order.route.ts`
  4. **Notifications**: `notification.route.ts`
  5. **Analytics**: `analytics.route.ts`
  6. **Layouts**: `layout.route.ts`

## Middleware
- **Error Handling**: `ErrorMiddleware` is applied globally to handle exceptions and send appropriate responses.

## Test Endpoint
- **Path**: `/test`
- **Response**:
  - Status: 200
  - JSON: `{ success: true, message: "API is working" }`

### Related Files
- `app.ts`: Configures the Express.js application.
- `routes/`: Contains route definitions for various modules.
- `middleware/error.ts`: Implements the global error-handling middleware.
