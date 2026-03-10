import type { Request, Response, NextFunction } from "express";
import APIError from "../utils/APIError.js";
import config from "../config/env.js";
import logger from "../utils/logger.js";

const isProduction = config.environment === "production";

const errorHandler = function (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  logger.error(err);

  if (err instanceof APIError) {
    return res.status(Number(err.statusCode)).json({
      success: false,
      message: err.message,
      stack: isProduction ? undefined : (err as Error).stack,
    });
  }

  res.status(500).json({
    success: false,
    message: isProduction ? "Internal Server Error" : (err as Error).message,
    stack: isProduction ? undefined : (err as Error).stack,
  });
};

export default errorHandler;
