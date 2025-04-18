# Module: Components (app/components/)

## Purpose
The `app/components/` directory contains reusable UI components that are used across the application. These components are organized into subdirectories based on their functionality.

## Structure & Logic
1. **Common Components**:
   - **`Header.tsx`**: The main header for the application.
   - **`Footer.tsx`**: The footer for the application.

2. **Admin Components**:
   - **Dashboard**: Includes `DashboardHeader.tsx` and `DashboardHero.tsx`.
   - **Analytics**: Components for course, user, and order analytics.
   - **Course Management**: Components for creating, editing, and previewing courses.
   - **Customization**: Components for editing categories, FAQs, and hero sections.
   - **Sidebar**: Admin sidebar navigation.

3. **AI Components**:
   - **`AiChat.tsx`**: Provides AI chat functionality.

4. **Auth Components**:
   - **`Login.tsx`**: Login form.
   - **`SignUp.tsx`**: Signup form.
   - **`Verification.tsx`**: Email verification.

5. **Course Components**:
   - **`CourseCard.tsx`**: Displays course information.
   - **`CourseContent.tsx`**: Handles course content display.
   - **`CourseDetailsPage.tsx`**: Detailed course page.

6. **Payment Components**:
   - **`CheckOutForm.tsx`**: Handles payment processing.

7. **Profile Components**:
   - **`Profile.tsx`**: User profile page.
   - **`ChangePassword.tsx`**: Password change functionality.

8. **Loader**:
   - **`Loader.tsx`**: Displays a loading spinner.

## Related Files
- **`Loader.css`**: Styles for the loader component.

## Notes
- The components are modular and reusable, promoting maintainability and scalability.
- The directory structure aligns with the application's features, making it easy to locate and manage components.
