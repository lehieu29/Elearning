# E-Learning Website with AI Doubt Assistance Support

This full-stack E-learning website allows tutors to upload courses and students to purchase them. Students can get doubt support by asking questions in a Q&A forum or through an AI assistant. The AI is trained on course transcripts to provide accurate answers specifically related to the course material. The website also offers real-time analytics for course insights and DRM protection for video content.

Check link - https://elearning-front-end.vercel.app/

## 🔋Core Features

1. Real-time student course purchase analytics on the admin dashboard.
2. Upload video of the course and generate its transcript.
3. Use the transcript of the video to train and fine-tune the AI model.
4. Student QNA, course purchase, and review instant notification on Admin Dashboard.

## Functionality: Analyze User Management

### Frontend
- **User Interaction**: Users can register, log in, update their profiles, and manage their accounts.
- **API Calls**:
  - Registration: Sends a POST request to `/registration` with user details.
  - Login: Sends a POST request to `/login` with email and password.
  - Profile Update: Sends a PUT request to `/update-user-info` with updated user details.
  - Password Update: Sends a PUT request to `/update-user-password` with old and new passwords.

### Backend
- **Request Handling**:
  - Registration: Validates email uniqueness, generates an activation token, and sends an activation email.
  - Login: Verifies user credentials and generates access/refresh tokens.
  - Profile Update: Updates user details in the database.
  - Password Update: Validates the old password and updates the new password securely.
- **Middleware**: Authentication and role-based authorization are applied to secure endpoints.

### Database
- **Collections**:
  - `users`: Stores user details, including name, email, hashed password, avatar, and roles.
  - **Fields**: `name`, `email`, `password`, `avatar`, `role`, `isVerified`.

---

## Functionality: Analyze Course Management

### Frontend
- **User Interaction**: Admins can create, edit, and delete courses. Users can view course details and access purchased courses.
- **API Calls**:
  - Create Course: Sends a POST request to `/create-course` with course details.
  - Edit Course: Sends a PUT request to `/edit-course/:id` with updated course details.
  - Delete Course: Sends a DELETE request to `/delete-course/:id`.
  - View Courses: Sends a GET request to `/get-courses` to fetch all courses.
  - View Course Details: Sends a GET request to `/get-course/:id`.

### Backend
- **Request Handling**:
  - Create Course: Uploads course data, including thumbnails, and saves it to the database.
  - Edit Course: Updates course details and handles thumbnail updates.
  - Delete Course: Removes the course from the database and clears related cache.
  - View Courses: Fetches all courses with limited details for performance.
  - View Course Details: Fetches detailed information about a specific course.
- **Middleware**: Authentication and admin role authorization are applied to secure endpoints.

### Database
- **Collections**:
  - `courses`: Stores course details, including name, description, price, and content.
  - **Fields**: `name`, `description`, `categories`, `price`, `thumbnail`, `tags`, `level`, `reviews`, `courseData`.

---

## Functionality: Analyze Order Management

### Frontend
- **User Interaction**: Users can purchase courses and view their order history. Admins can view all orders.
- **API Calls**:
  - Create Order: Sends a POST request to `/create-order` with course ID and payment information.
  - View Orders: Sends a GET request to `/get-orders` to fetch all orders (admin only).
  - Payment Intent: Sends a POST request to `/payment` with the payment amount.
  - Retrieve Stripe Key: Sends a GET request to `/payment/stripepublishablekey`.

### Backend
- **Request Handling**:
  - Create Order: Validates the course and user, processes the order, and sends a confirmation email.
  - View Orders: Fetches all orders for admin users.
  - Payment Intent: Handles payment processing (currently mocked).
  - Retrieve Stripe Key: Returns the Stripe publishable key for frontend integration.
- **Middleware**: Authentication and admin role authorization are applied to secure endpoints.

### Database
- **Collections**:
  - `orders`: Stores order details, including course ID, user ID, and payment information.
  - **Fields**: `courseId`, `userId`, `payment_info`.

---

## Functionality: Analyze Notifications

### Frontend
- **User Interaction**: Admins can view notifications and mark them as read.
- **API Calls**:
  - Fetch Notifications: Sends a GET request to `/get-all-notifications` to retrieve all notifications.
  - Update Notification Status: Sends a PUT request to `/update-notification/:id` to mark a notification as read.

### Backend
- **Request Handling**:
  - Fetch Notifications: Retrieves all notifications sorted by creation date.
  - Update Notification Status: Marks a notification as "read" and updates the database.
  - Scheduled Cleanup: Deletes notifications older than 30 days using a cron job.
- **Middleware**: Authentication and admin role authorization are applied to secure endpoints.

### Database
- **Collections**:
  - `notifications`: Stores notification details, including title, message, status, and user ID.
  - **Fields**: `title`, `message`, `status`, `userId`.

---

## Functionality: Analyze Analytics

### Frontend
- **User Interaction**: Admins can view analytics data for users, orders, and courses.
- **API Calls**:
  - Fetch User Analytics: Sends a GET request to `/get-users-analytics` to retrieve user data for the last 12 months.
  - Fetch Order Analytics: Sends a GET request to `/get-orders-analytics` to retrieve order data for the last 12 months.
  - Fetch Course Analytics: Sends a GET request to `/get-courses-analytics` to retrieve course data for the last 12 months.

### Backend
- **Request Handling**:
  - Fetch User Analytics: Uses the `generateLast12MothsData` utility to calculate user data.
  - Fetch Order Analytics: Uses the `generateLast12MothsData` utility to calculate order data.
  - Fetch Course Analytics: Uses the `generateLast12MothsData` utility to calculate course data.
- **Middleware**: Authentication and admin role authorization are applied to secure endpoints.

### Database
- **Collections**:
  - `users`, `orders`, `courses`: These collections are queried to generate analytics data.

---

## 🎯Problem It Solves

- Empowers students with multiple channels for resolving doubts and deepening course understanding.
- Provides teachers with an AI-powered tool to manage questions and offer more personalized support.
- Offers analytics to help instructors track student progress and identify areas for improvement.
- Protects Tutors' content rights by providing **DMR[Digital Media Rights]** Encryption.

## ⚙️Tech Stack

<img src="https://skillicons.dev/icons?i=nextjs,redux,materialui,tailwind,vercel,ts,express,mongo,redis,docker" />

### 🧑‍💻Language -

Typescript![Ts](https://img.shields.io/badge/-TypeScript-blue?logo=typescript&logoColor=white)

### 🎨Front-end -

- **NextJS 14:** Powerful React framework for server-side rendering, performance, and developer experience.
- **Tailwind CSS:** Utility-first CSS framework for rapid styling and customization.
- **Material UI:** Library of pre-built React components based on Google's Material Design.
- **Recharts:** Declarative charting library for creating visualizations.
- **socket.io-client:** Enables real-time bidirectional communication between client and server.
- **vdoCipher:** DRM service for securing video content.
- **Redux Toolkit Query:** Simplifies data fetching and management in Redux applications.
- **@google/generative-ai:** Integration with Google's Generative AI LLM for AI assistance.
- **NextAuth:** Streamlines social authentication.
- **Formik & Yup:** Robust form creation and validation tools.
- **@stripe/react-stripe-js:** Facilitates Stripe payment processing on the frontend.

### 🗄️Backend -

- **Express:** Node.js web framework for building APIs and server-side logic.
- **Nodemailer & EJS:** Facilitate email sending for notifications and user interactions.
- **Cloudinary & Multer:** Image and file storage/upload management.
- **Stripe:** Secure payment gateway integration.
- **MongoDB & Mongoose:** Flexible NoSQL database with an object modeling layer.
- **Redis:** In-memory data structure store for high-performance caching.
- **socket.io:** Real-time communication engine for backend-client interaction.
- **bcrypt & JWT:** Secure password hashing and JSON web token authentication.

### 📹Video To Text📜 -

- **Streamlit:** Creating an interactive and user-friendly web interface.
- **FFMPEGL** Video to Audio Conversion
- **AssemblyAI:** Ensuring high accuracy in speech-to-text conversion.
- **Docker:** Making the app portable and easy to manage across platforms.

## 🤸Quick Start

Follow these steps to set up the project locally on your machine.

**Prerequisites**

Make sure you have the following installed on your machine:

- [Git](https://git-scm.com/)
- [Node.js](https://nodejs.org/en)
- [npm](https://www.npmjs.com/) (Node Package Manager)

**Cloning the Repository** -

    git clone https://github.com/yghugardare/Elearning.git

**Installation**

Install the project dependencies using npm:
At client side

    cd client
    npm i

At server side -

    cd server
    npm i

**Set Up Environment Variables**

Create a new file named `.env` in the root of your client and server folder and add the content from `env.sample` file

**Running the Project**
At client side

    cd client
    npm run dev

At server side -

    cd server
    npm run dev

Client will run at - [http://localhost:3000](http://localhost:3000/)

Server will run ar - [http://localhost:8000](http://localhost:8000/)

---
