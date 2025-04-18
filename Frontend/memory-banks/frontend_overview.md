# Frontend Overview: Elearning Client

## General Information
- **Framework**: Next.js
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Redux Toolkit
- **Authentication**: NextAuth.js
- **AI Integration**: AI-powered features (e.g., `AiChat.tsx`).

## Key Features
1. **Admin Dashboard**: Manage categories, courses, analytics, and users.
2. **AI Features**: AI chat and course access with AI integration.
3. **Authentication**: User authentication using NextAuth.js.
4. **Course Management**: Create, edit, and view courses.
5. **Payment Integration**: Checkout form for handling payments.
6. **Profile Management**: User profile and password management.

## Project Structure
- **app/**: Main application logic, including pages, components, and utilities.
- **redux/**: Manages application state using Redux Toolkit.
- **pages/**: Next.js API routes and custom `_app.tsx`.
- **public/**: Static assets like images.
- **memory-banks/**: Documentation files for project modules.

## Libraries and Tools
- **Next.js**: Framework for server-side rendering and static site generation.
- **Tailwind CSS**: Utility-first CSS framework.
- **Redux Toolkit**: State management.
- **NextAuth.js**: Authentication.
- **PostCSS**: CSS processing.
- **TypeScript**: Strongly typed JavaScript.

## Logic Highlights
- **Admin Flow**: Admin pages for managing courses, users, and analytics.
- **User Flow**: Authentication, course access, and profile management.
- **API Integration**: Redux slices for handling API calls.

## Notes
- The project is modular and well-structured, with clear separation of concerns.
- AI integration and analytics suggest advanced features.
