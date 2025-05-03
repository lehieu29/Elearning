require("dotenv").config();
import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { ErrorMiddleware } from "./middleware/error";
import userRouter from "./routes/user.route";
import { courseRouter } from "./routes/course.route";
import { orderRouter } from "./routes/order.route";
import { notificationRouter } from "./routes/notification.route";
import { analyticsRouter } from "./routes/analytics.route";
import { layoutRouter } from "./routes/layout.route";
import healthRouter from "./routes/health.route";
import reportRouter from "./routes/report.routes";
// import userRouter

// create a server
export const app = express();
// body parser
app.use(express.json({ limit: "50mb" }));

// cookie parse
app.use(cookieParser());

// Debug để kiểm tra cấu hình CORS
const allowedOrigins = process.env.ORIGIN?.split(",").map(origin => {
  // Tự động thêm protocol http:// nếu chưa có
  return origin.includes('://') ? origin : `http://${origin}`;
}) || ["http://localhost:3000"];

console.log("Allowed CORS Origins:", allowedOrigins);

// cors với debug thêm để kiểm tra request origin
app.use(
  cors({
    origin: function(origin, callback) {
      // In ra origin của request để debug
      console.log("Request Origin:", origin);
      
      // allow requests with no origin (like mobile apps, curl, postman)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.indexOf(origin) === -1) {
        console.log(`Origin ${origin} not allowed by CORS`);
        return callback(null, false);
      }
      
      return callback(null, true);
    },
    credentials: true
  })
);

// routes
app.use(
  "/api/v1",
  userRouter,
  courseRouter,
  orderRouter,
  notificationRouter,
  analyticsRouter,
  layoutRouter,
  healthRouter,
  reportRouter
);

app.get("/test", (req: Request, res: Response, next: NextFunction) => {
  res.status(200).json({
    success: true,
    message: "API is working",
  });
});
// unknown route
app.all("*", (req: Request, res: Response, next: NextFunction) => {
  const err = new Error(`Route ${req.originalUrl} not found`) as any;
  err.statusCode = 404;
  next(err);
});

// middleware calls
app.use(ErrorMiddleware);
