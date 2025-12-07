import type { Request, Response, NextFunction } from "express";
import APIError from '../utils/APIError.js';

const errorHandler = function (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error(err);
  if (err instanceof APIError) {
    return res.status(Number(err.statusCode)).json({
      success: false,
      message: err.message,
    });
  }
  res.status(500).json({
    success: false,
    message: "Internal Server Error",
  });
};

export default errorHandler;
