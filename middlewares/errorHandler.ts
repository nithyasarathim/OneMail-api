import type{ Request, Response, NextFunction } from "express";
const { APIError } = require("../utils/APIError");

const errorHandler = function (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error(err.stack || err);
  if (err instanceof APIError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }
  res.status(500).json({
    success: false,
    message: "Internal Server Error",
  });
};

module.exports = errorHandler;
