import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import config from "../config/env.js";
import type { Request, Response, NextFunction } from "express";
import APIError from "../utils/APIError.js";
import logger from "../utils/logger.js";

const isProduction = config.environment === "production";

const WINDOW_MS = Number(config.ratelimitwindow) || 60000;
const MAX_REQUESTS = Number(config.ratelimit) || (isProduction ? 100 : 10);

const rateLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    return isProduction
      ? (req.headers["x-forwarded-for"] as string) || req.ip || "unknown"
      : ipKeyGenerator(req, {} as any) || "dev-ip";
  },
  handler: (req: Request, res: Response, next: NextFunction) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`, {
      path: req.path,
      ip: req.ip,
      limit: MAX_REQUESTS,
    });
    next(
      new APIError(
        "Too many requests from this IP, please try again later",
        429,
      ),
    );
  },
  skip: (req: Request) => !isProduction && req.ip === "127.0.0.1",
});

export default rateLimiter;
