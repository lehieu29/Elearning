# User Module: Elearning Server

## Overview
The `user` module handles all user-related operations, including registration, authentication, profile management, and admin-specific actions. It integrates with various utilities and services for seamless functionality.

## Key Functions
1. **Registration**:
   - Validates user input and checks for existing email.
   - Sends an activation email with a unique activation code.
   - Uses `createActivationToken` to generate activation tokens.

2. **Activation**:
   - Verifies activation token and code.
   - Creates a new user in the database if validation succeeds.

3. **Login**:
   - Validates user credentials.
   - Issues JWT tokens and stores session data in Redis.

4. **Logout**:
   - Clears access and refresh tokens from cookies.
   - Deletes user session from Redis.

5. **Profile Management**:
   - Updates user information (name, email, password, avatar).
   - Uses Cloudinary for avatar uploads and Redis for caching.

6. **Admin Actions**:
   - Retrieves all users.
   - Updates user roles.
   - Deletes users and their associated data.

## Related Files
- **Controller**: `controller/user.controller.ts`
- **Model**: `models/user.model.ts`
- **Service**: `services/user.service.ts`
- **Utilities**:
  - `utils/jwt.ts`: Handles token generation and validation.
  - `utils/redis.ts`: Manages Redis integration.
  - `utils/sendMail.ts`: Sends activation emails.
  - `utils/ErrorHandler.ts`: Custom error handling.

## Logic Highlights
- **Token Management**:
  - Access and refresh tokens are issued using JWT.
  - Redis is used to store session data for enhanced security.
- **Email Activation**:
  - Activation emails are rendered using EJS templates.
  - Cloudinary is used for managing user avatars.
- **Error Handling**:
  - Centralized error handling using `ErrorHandler`.

## Notes
- **Environment Variables**:
  - `ACTIVATION_SECRET`: Used for activation token encryption.
  - `REFRESH_TOKEN`: Used for refresh token encryption.
  - `ACCESS_TOKEN`: Used for access token encryption.
- **Caching**:
  - Redis is used extensively for session and user data caching.
- **Security**:
  - Passwords are hashed and compared securely.
  - Tokens have short expiration times for added security.
