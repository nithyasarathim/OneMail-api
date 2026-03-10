import type { Request, Response, NextFunction } from "express";
import logger from "../utils/logger.js";
import config from "../config/env.js";

const isProduction = config.environment === "production";

const requestLogger = function (
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    const ip = isProduction
      ? (req.headers["x-forwarded-for"] as string) || req.ip || "unknown"
      : req.ip || "unknown";

    const logData = {
      timestamp: new Date().toISOString(),
      ip: ip,
      method: req.method,
      status: res.statusCode,
      duration: `${duration}ms`,
      url: req.originalUrl,
      userAgent: req.get("user-agent") || "unknown",
    };

    isProduction
      ? logger.info("Incoming Request", logData)
      : console.log(
          `${logData.timestamp} │ ` +
            `${logData.ip.padEnd(15)} │ ` +
            `${logData.method.padEnd(6)} │ ` +
            `${String(logData.status).padStart(3)} │ ` +
            `${logData.duration.padStart(6)} │ ` +
            `${logData.url}`,
        );
  });

  next();
};

export default requestLogger;
