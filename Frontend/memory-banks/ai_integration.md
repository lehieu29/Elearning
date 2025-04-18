# AI Integration: Elearning Client

## Overview
The AI integration module provides an AI-powered chat interface for users to interact with course-related content. It leverages Google Generative AI for generating responses and integrates with Redux for fetching transcripts.

## Key Component: `AiChat.tsx`
1. **Purpose**:
   - Implements a chat interface for users to ask questions related to course videos.
   - Generates AI responses based on video transcripts and course context.

2. **Features**:
   - **Chat Functionality**:
     - Handles user input and displays chat history.
     - Supports real-time AI responses using Google Generative AI.
   - **Transcript Integration**:
     - Fetches video transcripts via Redux API calls.
     - Summarizes transcripts or provides context-based answers.
   - **Safety Settings**:
     - Filters harmful content using predefined safety thresholds.
   - **Styling**:
     - Utilizes Tailwind CSS for responsive design.
   - **Theme Support**:
     - Integrates with `ThemeSwitcher` for light/dark mode.

3. **Logic Highlights**:
   - **AI Model**:
     - Uses the `gemini-1.0-pro-001` model from Google Generative AI.
     - Configured with parameters like temperature, topK, and maxOutputTokens.
   - **Prompt Engineering**:
     - Constructs prompts based on user input, video name, and transcript availability.
     - Ensures responses are relevant to the course context.
   - **Error Handling**:
     - Displays error messages for failed API calls or AI responses.

## Related Files
- **Component**: `app/components/AI/AiChat.tsx`
- **Utilities**:
  - `app/utils/ThemeSwitcher.tsx`: Handles theme switching.
  - `app/styles/style.ts`: Provides shared styles.
- **Redux**:
  - `redux/features/courses/coursesApi.ts`: Fetches video transcripts.

## Notes
- **Environment Variables**:
  - `API_KEY`: Used for authenticating with Google Generative AI.
- **Dependencies**:
  - `@google/generative-ai`: For AI-powered responses.
  - `@reduxjs/toolkit`: For state management.
  - `next/navigation`: For accessing course IDs.
- **Security**:
  - Safety settings block harmful content categories like harassment and hate speech.
