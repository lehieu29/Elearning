# Project Overview: Elearning Website Backend

## General Information
- **Project Name**: Elearning Website Backend
- **Primary Language**: TypeScript
- **Frameworks/Libraries**: 
  - Backend: Express.js
  - Database: Mongoose (MongoDB)
  - Realtime Communication: Socket.IO
  - Task Scheduling: Node-Cron
  - Email Service: Nodemailer
  - Cloud Storage: Cloudinary
  - Redis: IORedis
- **Environment**: Node.js 18.x
- **Build Tool**: TypeScript Compiler (tsc)

## Key Features
1. **User Management**: Handles user-related operations via `user.controller.ts` and `user.route.ts`.
2. **Course Management**: Manages courses with `course.controller.ts` and `course.route.ts`.
3. **Order Processing**: Processes orders using `order.controller.ts` and `order.route.ts`.
4. **Notifications**: Manages notifications with `notification.controller.ts` and `notification.route.ts`.
5. **Analytics**: Provides analytics via `analytics.controller.ts` and `analytics.route.ts`.
6. **Layouts**: Handles layout-related operations with `layout.controller.ts` and `layout.route.ts`.
7. **Realtime Notifications**: Implements a WebSocket server for broadcasting notifications.
8. **Database Connection**: Connects to MongoDB using Mongoose.
9. **Redis Integration**: Utilizes Redis for caching or other purposes.
10. **Cloudinary Integration**: Manages media uploads to Cloudinary.

## Project Structure
- **Entry Point**: `server.ts`
- **Application Setup**: `app.ts`
- **Controllers**: Located in `controller/` directory.
- **Routes**: Defined in `routes/` directory.
- **Services**: Business logic implemented in `services/` directory.
- **Utilities**: Helper functions and configurations in `utils/` directory.
- **Middleware**: Custom middleware in `middleware/` directory.
- **Models**: Mongoose schemas in `models/` directory.
- **Mail Templates**: EJS templates in `mails/` directory.

## Notes
- **Environment Variables**: Managed via `.env` file.
- **Scripts**:
  - `dev`: Starts the development server with hot-reloading.
  - `build`: Compiles TypeScript to JavaScript.
  - `start`: Runs the production server.
- **Dependencies**: Includes libraries for authentication, email, cloud storage, and more.

## Related Files
- `server.ts`: Initializes the server and integrates Socket.IO.
- `app.ts`: Configures Express.js application and routes.
- `utils/db.ts`: Handles MongoDB connection.
- `utils/redis.ts`: Configures Redis client.
- `socketServer.ts`: Sets up WebSocket server.
