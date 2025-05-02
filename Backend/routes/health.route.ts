import express from "express";
const healthRouter = express.Router();

healthRouter.get("/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "API is healthy",
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
    });
});

export default healthRouter;