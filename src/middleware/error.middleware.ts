import type { ErrorRequestHandler } from "express";


const errorMiddleware: ErrorRequestHandler = (error, req, res, next) => {
  console.error(error);

  res.status(500).json({
    message: "Internal server error"
  });

};

export default errorMiddleware;