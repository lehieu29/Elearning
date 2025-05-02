import { NextFunction, Request, Response } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncError";
import ErrorHandler from "../utils/ErrorHandler";
import cloudinary from "cloudinary";
import fs from "fs";
import { emitVideoProgress } from "../socketServer";  // Thêm import này
import { createCourse, getAllCoursesService } from "../services/course.service";
import CourseModel from "../models/course.model";
import { redis } from "../utils/redis";
import mongoose from "mongoose";
import path from "path";
import os from "os";
import ejs from "ejs";
import sendMail from "../utils/sendMail";
import NotificationModel from "../models/notification.model";
import axios from "axios";
import { AIModel } from "../models/ai.model";
import { processVideoAndGenerateSubtitlesOptimized, cleanupTempFiles } from "../services/subtitle.service";

// upload video handler
export const uploadVideoHandler = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const file = req.file;
      if (!file) {
        return next(new ErrorHandler(`No file uploaded`, 400));
      }

      // Tạo ID xử lý duy nhất
      const processId = `vid_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const fileName = file.originalname;

      console.log(`[${processId}] Processing file: ${fileName}, Size: ${file.size}, Type: ${file.mimetype}`);

      // Kiểm tra file tồn tại trên disk
      const filePath = file.path;
      if (!fs.existsSync(filePath)) {
        return next(new ErrorHandler(`File was not properly saved to disk: ${filePath}`, 500));
      }

      // Kiểm tra kích thước file thực tế
      const stats = fs.statSync(filePath);
      if (stats.size === 0) {
        return next(new ErrorHandler(`File is empty (0 bytes)`, 400));
      }

      console.log(`[${processId}] File verified on disk: ${filePath}, Size: ${stats.size} bytes`);

      // Xác định loại nội dung video
      const contentType = req.body.contentType || 'lecture';

      // Thông báo đang bắt đầu xử lý video và trả về processId ngay lập tức
      res.status(202).json({
        success: true,
        message: 'Video upload started, processing in background',
        processId: processId,
        fileName: fileName
      });

      // Phát sóng trạng thái bắt đầu
      emitVideoProgress(processId, 0, 'Upload started', { fileName });

      // Xử lý video bất đồng bộ
      processVideoAsync(processId, filePath, fileName, contentType);

    } catch (error: any) {
      console.error(`Video upload error: ${error.message}`);

      // Cleanup file if exists and upload failed
      if (req.file && req.file.path && fs.existsSync(req.file.path)) {
        try {
          fs.unlinkSync(req.file.path);
          console.log(`Cleaned up temp file: ${req.file.path}`);
        } catch (cleanupError: any) {
          console.error(`Failed to clean up temp file: ${cleanupError.message}`);
        }
      }

      return next(new ErrorHandler(error.message, 500));
    }

    // Hàm xử lý video bất đồng bộ
    async function processVideoAsync(processId: string, filePath: string, fileName: string, contentType: string) {
      // Đường dẫn tạm thời cho các file xử lý
      const tempDir = path.join(os.tmpdir(), 'video-processing', processId);
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      try {
        // 1. Tạo phụ đề và gắn vào video
        emitVideoProgress(processId, 5, 'Bắt đầu xử lý video và tạo phụ đề...', { fileName });

        const { outputVideoPath } = await processVideoAndGenerateSubtitlesOptimized(
          filePath,
          { contentType },
          (progress, message) => {
            // Cập nhật tiến độ qua Socket.IO
            emitVideoProgress(processId, progress, message, { fileName });
          }
        );

        // 2. Upload video có phụ đề lên Cloudinary
        emitVideoProgress(processId, 85, 'Đang tải video lên Cloudinary...', { fileName });

        const result = await cloudinary.v2.uploader.upload(outputVideoPath, {
          resource_type: "video",
          folder: "courses/videos",
          timeout: 600000, // 10 phút timeout
        });

        // Thành công - phát sóng kết quả cuối cùng với thông tin video
        emitVideoProgress(processId, 100, 'Processing completed and uploaded!', { 
          fileName,
          publicId: result.public_id,
          url: result.secure_url,
          duration: result.duration,
          format: result.format
        });

        console.log(`[${processId}] Cloudinary upload success: ${result.public_id}`);

        // 3. Lưu kết quả vào database/cache (để frontend có thể truy vấn sau)
        // Trong môi trường thực tế, bạn có thể lưu vào Redis hoặc database
        // Ví dụ: await redis.set(`video_process:${processId}`, JSON.stringify({
        //   success: true,
        //   videoUrl: result.secure_url,
        //   publicId: result.public_id,
        //   duration: result.duration,
        //   format: result.format,
        // }));

        // 4. Dọn dẹp files
        cleanupTempFiles([filePath, tempDir]);

        // 5. Tính toán thời gian hoàn thành
        console.log(`[${processId}] Processing completed successfully`);

      } catch (processingError: any) {
        console.error(`[${processId}] Video processing error: ${processingError.message}`);
        emitVideoProgress(processId, 50, `Gặp lỗi khi xử lý: ${processingError.message}`, { fileName });

        // Nếu xử lý phụ đề thất bại, vẫn upload video gốc lên Cloudinary
        try {
          emitVideoProgress(processId, 60, 'Đang tải video gốc lên Cloudinary...', { fileName });

          const result = await cloudinary.v2.uploader.upload(filePath, {
            resource_type: "video",
            folder: "courses/videos",
            timeout: 600000,
          });

          emitVideoProgress(processId, 100, 'Đã tải lên video gốc (không có phụ đề)', { 
            fileName,
            publicId: result.public_id,
            url: result.secure_url,
            duration: result.duration,
            format: result.format,
            warning: 'Video uploaded without subtitles due to processing error'
          });

          console.log(`[${processId}] Fallback upload success: ${result.public_id}`);

          // Lưu kết quả với cảnh báo
          // await redis.set(`video_process:${processId}`, JSON.stringify({
          //   success: true,
          //   videoUrl: result.secure_url,
          //   publicId: result.public_id,
          //   duration: result.duration,
          //   format: result.format,
          //   warning: 'Video uploaded without subtitles due to processing error'
          // }));

          // Dọn dẹp file tạm
          cleanupTempFiles([filePath, tempDir]);

        } catch (fallbackError: any) {
          console.error(`[${processId}] Fallback upload error: ${fallbackError.message}`);
          emitVideoProgress(processId, 100, `Thất bại hoàn toàn: ${fallbackError.message}`, { 
            fileName,
            error: fallbackError.message
          });

          // Lưu thông tin lỗi
          // await redis.set(`video_process:${processId}`, JSON.stringify({
          //   success: false,
          //   error: `Failed to process video: ${processingError.message}`,
          //   fallbackError: fallbackError.message
          // }));

          // Dọn dẹp file tạm
          cleanupTempFiles([filePath, tempDir]);
        }
      }
    }
  }
);

// Endpoint mới để kiểm tra trạng thái xử lý
export const checkProcessingStatus = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { processId } = req.params;

      if (!processId) {
        return next(new ErrorHandler('Process ID is required', 400));
      }

      // Trong môi trường thực tế, truy vấn Redis hoặc database
      // const processInfo = await redis.get(`video_process:${processId}`);

      // Giả định đang sử dụng zmq hoặc socketio cho updates thực tế

      // Mô phỏng
      const processInfo = {
        status: 'processing',
        progress: 50,
        message: 'Xử lý đang tiếp tục...'
      };

      res.status(200).json({
        success: true,
        processInfo
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// upload course
export const uploadCourse = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body;
      const thumbnail = data.thumbnail;
      if (thumbnail) {
        const myCloud = await cloudinary.v2.uploader.upload(thumbnail, {
          folder: "courses",
        });
        // add thumbnail to the data
        data.thumbnail = {
          public_id: myCloud.public_id,
          url: myCloud.secure_url,
        };
      }
      createCourse(data, res, next);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// edit the course
export const editCourse = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body;

      const thumbnail = data.thumbnail;

      const courseId = req.params.id;

      const courseData = (await CourseModel.findById(courseId)) as any;

      if (thumbnail && !thumbnail.startsWith("https")) {
        await cloudinary.v2.uploader.destroy(courseData.thumbnail.public_id);

        const myCloud = await cloudinary.v2.uploader.upload(thumbnail, {
          folder: "courses",
        });

        data.thumbnail = {
          public_id: myCloud.public_id,
          url: myCloud.secure_url,
        };
      }

      if (thumbnail.startsWith("https")) {
        data.thumbnail = {
          public_id: courseData?.thumbnail.public_id,
          url: courseData?.thumbnail.url,
        };
      }

      const course = await CourseModel.findByIdAndUpdate(
        courseId,
        {
          $set: data,
        },
        { new: true }
      );

      res.status(201).json({
        success: true,
        course,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// get single course w/o purchasing
export const getSingleCourse = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const courseId = req.params.id;
      // get course cache ,JSON
      const isCacheExist = await redis.get(courseId);
      if (isCacheExist) {
        // debug
        // console.log("redis hitt");
        // make it object
        const course = JSON.parse(isCacheExist);
        res.status(200).json({
          success: true,
          course,
        });
      } else {
        // console.log("mongodb hit");
        // get the course
        const course = await CourseModel.findById(courseId).select(
          "-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links"
        );
        // set course to redis , so that next time info is rendered directly from the cache
        // expiration time of 60x60x24x7 = 604800 = 7days, for the course data
        // advance cache
        await redis.set(courseId, JSON.stringify(course), "EX", 604800);
        res.status(200).json({
          success: true,
          course,
        });
      }
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);
// get all courses
export const getAllCourses = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // dont store in cache
      const courses = await CourseModel.find().select(
        "-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links"
      );
      res.status(200).json({
        success: true,
        courses,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);
// get course content only for those who purchased it
export const getCourseByUser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // fetch user course list
      const userCourseList = req.user?.courses;

      // console.log(req.user?.name)
      // console.log(userCourseList)

      // get course id from param url
      const courseId = req.params.id;
      // has the user purchased?

      //if he is user then
      if (req.user?.role === "user") {
        const courseExists = userCourseList?.find(
          (course: any) => course._id.toString() === courseId
        );
        if (!courseExists) {
          return next(
            new ErrorHandler("You are not eligible to access this course", 404)
          );
        }
      }
      // get course
      const course = await CourseModel.findById(courseId);
      // get constent
      const content = course?.courseData;
      res.status(200).json({
        success: true,
        content,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);
// add question to our course
interface IAddQuestionData {
  question: string;
  courseId: string;
  contentId: string;
}
export const addQuestion = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // fetch question from client
      const { question, courseId, contentId }: IAddQuestionData = req.body;
      // get the course from course id
      const course = await CourseModel.findById(courseId);
      // check if the content id is valid or not
      if (!mongoose.Types.ObjectId.isValid(contentId)) {
        return next(new ErrorHandler("Invalid content Id", 400));
      }

      // get the course content
      const courseContent = course?.courseData?.find((item: any) => {
        return item._id.equals(contentId);
      });

      // if course content not found
      if (!courseContent) {
        return next(new ErrorHandler("Invalid content Id", 400));
      }
      // create a new question
      const newQuestion: any = {
        user: req.user,
        question,
        questionReplies: [],
      };
      // add questionn to course content
      courseContent.questions.push(newQuestion);
      // send notfication for the question to the admin
      await NotificationModel.create({
        user: req.user?._id,
        title: "New Question Received",
        message: `You have a new question in ${courseContent.title}`,
      });

      //save the course conten to mongo db
      await course?.save();
      res.status(200).json({
        success: true,
        course,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);
interface IAddAnswerData {
  answer: string;
  courseId: string;
  contentId: string;
  questionId: string;
}
export const addAnwser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // fetch answer for frontend
      const { answer, courseId, contentId, questionId }: IAddAnswerData =
        req.body;
      // get the course from course id
      const course = await CourseModel.findById(courseId);
      // check if the content id is valid or not
      if (!mongoose.Types.ObjectId.isValid(contentId)) {
        return next(new ErrorHandler("Invalid content Id", 400));
      }
      // get the course content
      const courseContent = course?.courseData?.find((item: any) =>
        item._id.equals(contentId)
      );
      // if course content not found
      if (!courseContent) {
        return next(new ErrorHandler("Invalid content Id", 400));
      }
      // search question
      const question = courseContent?.questions?.find((item: any) =>
        item._id.equals(questionId)
      );
      // handle case
      if (!question) {
        return next(new ErrorHandler("Invalid Question Id", 400));
      }
      // create  a new answer object
      const newAnswer: any = {
        user: req.user,
        answer,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // add answer to course content
      question.questionReplies.push(newAnswer);
      // save to data base
      await course?.save();
      // if i am replying to my own question then no need to send me mail
      if (req.user?._id === question.user?._id) {
        // create a notification
        console.log("Same ho");
        await NotificationModel.create({
          user: req.user?._id,
          title: "New Question Reply Received",
          message: `You have a new question reply in ${courseContent.title}`,
        });
      } else {
        // send mail
        const data = {
          name: question.user.name,
          title: courseContent.title,
        };
        // use ejs to render html file with data
        const html = await ejs.renderFile(
          path.join(__dirname, "../mails/question-reply.ejs"),
          data
        );
        // send mail
        try {
          await sendMail({
            email: question.user.email,
            subject: "Question Reply",
            template: "question-reply.ejs",
            data,
          });
        } catch (error: any) {
          return next(new ErrorHandler(error.message, 500));
        }
      }
      // send response
      res.status(200).json({
        success: true,
        course,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);
interface IAddReviewData {
  review: string;

  rating: number;
  userId: string;
}
// add review and ratings in course
export const addReview = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // get course list and course id
      const userCourseList = req.user?.courses;
      const courseId = req.params.id;
      // check if course exist based on course id
      const courseExists = userCourseList?.some(
        (course: any) => course._id.toString() === courseId.toString()
      );
      if (!courseExists) {
        return next(
          new ErrorHandler("You are not eligible to access this course", 404)
        );
      }
      // get gourse
      const course = await CourseModel.findById(courseId);
      const { review, rating } = req.body as IAddReviewData;
      const reviewData: any = {
        user: req.user,
        rating,
        comment: review,
      };
      course?.reviews.push(reviewData);
      let avg = 0;
      course?.reviews.forEach((rev: any) => {
        avg += rev.rating;
      });
      if (course) {
        course.ratings = avg / course.reviews.length;
      }
      await course?.save();
      // const notification = {
      //   // user: req.user?._id,
      //   title: "New Review Received",
      //   message: `${req.user?.name} has given a review in ${course?.name}`,
      // };
      await redis.set(courseId, JSON.stringify(course), "EX", 604800); // 7days

      // create notification
      await NotificationModel.create({
        user: req.user?._id,
        title: "New Review Received",
        message: `${req.user?.name} has given a review in ${course?.name}`,
      });
      res.status(200).json({
        success: true,
        course,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);
//add reply to review only for admin
interface IAddReviewData {
  comment: string;
  courseId: string;
  reviewId: string;
}
export const addReplyToReview = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // get data from client
      const { comment, courseId, reviewId } = req.body as IAddReviewData;
      // get course from mongo db
      const course = await CourseModel.findById(courseId);
      if (!course) {
        return next(new ErrorHandler("Course not found", 404));
      }
      // console.log(course)
      // get review from the course
      const review = course?.reviews?.find(
        (rev: any) => rev._id.toString() === reviewId
      );
      if (!review) {
        return next(new ErrorHandler("Review not found", 404));
      }
      const replyData: any = {
        user: req.user,
        comment,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      if (!review.commentReplies) {
        review.commentReplies = [];
      }
      // push reply to comment replies
      review.commentReplies?.push(replyData);

      // save to ddb
      await course?.save();
      // await redis.set(courseId, JSON.stringify(course), "EX", 604800); // 7days
      res.status(200).json({
        success: true,
        course,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);
// get all course related info for admin
export const getAdminAllCourses = CatchAsyncError(
  async (req: Response, res: Response, next: NextFunction) => {
    try {
      getAllCoursesService(res);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);
// delete course for admin
export const deleteCourse = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const course = await CourseModel.findById(id);

      if (!course) {
        return next(new ErrorHandler("course not found", 404));
      }

      await course.deleteOne({ id });

      await redis.del(id);

      res.status(200).json({
        success: true,
        message: "course deleted successfully",
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// generate video url
export const generateVideoUrl = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { videoId } = req.body;
      const response = await axios.post(
        `https://dev.vdocipher.com/api/videos/${videoId}/otp`,
        { ttl: 300 }, // expiry
        {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Apisecret ${process.env.VDOCIPHER_API_SECRET}`,
          },
        }
      );
      res.json(response.data);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// function to get transcript and course name from course
export const getTranscript = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { videoName } = req.body;
      // console.log(videoName);
      const course = await CourseModel.findById(id);
      const courseName = course?.name;
      const ai = await AIModel.findOne({ title: videoName });
      // console.log(ai, "ai");
      const transcript = ai?.transcription;
      res.status(200).json({
        success: true,
        transcript,
        courseName
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

/**
 * Thêm phụ đề vào video và tải lên Cloudinary
 * Không kiểm tra isAuthenticated và authorizeRoles
 */
export const addSubtitlesToVideo = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const file = req.file;
      if (!file) {
        return next(new ErrorHandler(`No file uploaded`, 400));
      }

      // Tạo ID xử lý duy nhất
      const processId = `subtitle_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      console.log(`[${processId}] Processing file: ${file.originalname}, Size: ${file.size}, Type: ${file.mimetype}`);

      // Kiểm tra file tồn tại trên disk
      const filePath = file.path;
      if (!fs.existsSync(filePath)) {
        return next(new ErrorHandler(`File was not properly saved to disk: ${filePath}`, 500));
      }

      // Kiểm tra kích thước file thực tế
      const stats = fs.statSync(filePath);
      if (stats.size === 0) {
        return next(new ErrorHandler(`File is empty (0 bytes)`, 400));
      }

      // Lấy loại nội dung từ request body
      const contentType = req.body.contentType || 'lecture';

      try {
        // Tạo thư mục tạm thời cho xử lý video
        const tempDir = path.join(os.tmpdir(), 'video-processing', processId);
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }

        // Xử lý video, tạo phụ đề và gắn phụ đề (đồng bộ)
        console.log(`[${processId}] Đang xử lý video và tạo phụ đề...`);

        const { outputVideoPath } = await processVideoAndGenerateSubtitlesOptimized(
          filePath,
          { contentType },
          (progress, message) => {
            console.log(`[${processId}] ${progress}%: ${message}`);
          }
        );

        // Tải lên Cloudinary
        console.log(`[${processId}] Đang tải video lên Cloudinary...`);
        const result = await cloudinary.v2.uploader.upload(outputVideoPath, {
          resource_type: "video",
          folder: "courses/videos",
          timeout: 600000, // 10 phút timeout
        });

        console.log(`[${processId}] Cloudinary upload success: ${result.public_id}`);

        // Dọn dẹp files
        cleanupTempFiles([filePath, tempDir]);

        // Trả về kết quả
        res.status(200).json({
          success: true,
          message: 'Video with subtitles processed and uploaded successfully',
          data: {
            url: result.secure_url,
            publicId: result.public_id,
            duration: result.duration,
            format: result.format
          }
        });
      } catch (error: any) {
        console.error(`[${processId}] Video processing error: ${error.message}`);

        // Cleanup file if exists
        if (fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
            console.log(`Cleaned up temp file: ${filePath}`);
          } catch (cleanupError: any) {
            console.error(`Failed to clean up temp file: ${cleanupError.message}`);
          }
        }

        return next(new ErrorHandler(error.message, 500));
      }
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);