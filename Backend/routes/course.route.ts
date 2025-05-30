import express from "express";
import upload from "../middleware/upload";
import { authorizeRoles, isAuthenticated } from "../middleware/auth";
import {
  addAnwser,
  addQuestion,
  addReplyToReview,
  addReview,
  addSubtitlesToVideo,
  deleteCourse,
  editCourse,
  generateVideoUrl,
  getAdminAllCourses,
  getAllCourses,
  getCourseByUser,
  getSingleCourse,
  getTranscript,
  uploadCourse,
  uploadVideoHandler,
} from "../controller/course.controller";
// import { updateAccessToken } from "../controller/user.controller";
// create course router
export const courseRouter = express.Router();

courseRouter.post(
  "/create-course",

  isAuthenticated,

  authorizeRoles("admin"),
  uploadCourse
);

courseRouter.put(
  "/edit-course/:id",

  isAuthenticated,
  authorizeRoles("admin"),
  editCourse
);

courseRouter.get("/get-course/:id", getSingleCourse);

courseRouter.get("/get-courses", getAllCourses);
courseRouter.get(
  "/get-course-content/:id",
  isAuthenticated,
  getCourseByUser
);
courseRouter.put(
  "/add-question",

  isAuthenticated,
  addQuestion
);
courseRouter.put("/add-answer", isAuthenticated, addAnwser);
courseRouter.put(
  "/add-review/:id",
  isAuthenticated,
  addReview
);
courseRouter.put(
  "/add-reply",
  isAuthenticated,
  authorizeRoles("admin"),
  addReplyToReview
);
courseRouter.get(
  "/get-admin-courses",

  isAuthenticated,
  authorizeRoles("admin"),
  getAdminAllCourses
);
courseRouter.delete(
  "/delete-course/:id",
  isAuthenticated,
  authorizeRoles("admin"),
  deleteCourse
);
courseRouter.post("/getVdoCipherOTP", generateVideoUrl);

courseRouter.post(
  "/upload-video",
  isAuthenticated,
  authorizeRoles("admin"),
  upload.single("file"),
  uploadVideoHandler
);

// TODO
/*courseRouter.post(
  "/upload-video",
  isAuthenticated,
  authorizeRoles("admin"),
  upload.single("file"),
  addSubtitlesToVideo
);*/

// Allow anonymous users to upload subtitles
courseRouter.post(
  "/add-subtitle",
  upload.single("file"),
  addSubtitlesToVideo
);

courseRouter.post("/ai/:id",getTranscript);
