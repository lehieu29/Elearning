# Backend Overview: Elearning Server

## General Information
- **Framework**: Express.js
- **Language**: TypeScript
- **Environment**: Node.js 18.x
- **Build Tool**: TypeScript Compiler (tsc)

## Key Features
1. **User Management**: Handles user-related operations.
2. **Course Management**: Manages courses and their content.
3. **Order Processing**: Processes orders and payments.
4. **Notifications**: Manages user notifications.
5. **Analytics**: Provides data insights and analytics.
6. **Realtime Communication**: Implements WebSocket for notifications.
7. **Database**: MongoDB integration using Mongoose.
8. **Caching**: Redis integration for caching and pub/sub.
9. **Email Service**: Nodemailer for transactional emails.
10. **Media Management**: Cloudinary for media uploads.

## Project Structure
- **Entry Point**: `server.ts`
- **Application Setup**: `app.ts`
- **Controllers**: Located in `controller/` directory.
- **Routes**: Defined in `routes/` directory.
- **Services**: Business logic implemented in `services/` directory.
- **Models**: Mongoose schemas in `models/` directory.
- **Utilities**: Helper functions in `utils/` directory.
- **Middleware**: Custom middleware in `middleware/` directory.
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
