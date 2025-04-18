# Module: app/

## Purpose
The `app/` directory serves as the core of the application, containing the main pages, components, and utilities for the Elearning platform. It is structured to support modular development and scalability.

## Structure & Logic
1. **Pages**:
   - **`page.tsx`**: The main landing page of the application.
   - **`about/`**: Contains the "About" page (`About.tsx` and `page.tsx`).
   - **`admin/`**: Admin dashboard with subdirectories for managing categories, courses, analytics, users, and more.
   - **`course/`**: Handles course details and access.
   - **`profile/`**: User profile management.

2. **Components**:
   - **`components/`**: Houses reusable UI components, including:
     - **Header/Footer**: Common layout components.
     - **Admin Components**: Dashboard, analytics, and course management components.
     - **AI Components**: `AiChat.tsx` for AI chat functionality.
     - **Auth Components**: Login, signup, and verification.
     - **Course Components**: Course cards, content, and details.
     - **Payment Components**: Checkout form.
     - **Profile Components**: Profile and password management.

3. **Utilities**:
   - **`utils/`**: Contains helper functions and utilities like `CoursePlayer.tsx`, `ThemeSwitcher.tsx`, and `Ratings.tsx`.

## Related Files
- **`globals.css`**: Global styles for the application.
- **`layout.tsx`**: Defines the layout structure for pages.
- **`Provider.tsx`**: Context provider for managing global state.

## Notes
- The `app/` directory is structured to align with Next.js conventions, supporting server-side rendering and static site generation.
- The modular organization of components and utilities promotes reusability and maintainability.
