import type { ErrorRequestHandler } from "express";
import AppError from "@/utils/app-error.js";


const errorMiddleware: ErrorRequestHandler = (error, req, res, _next) => {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      message: error.message
    });
  }

  console.error(error);

  return res.status(500).json({
    message: "Internal server error"
  });
};

export default errorMiddleware;