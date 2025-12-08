import type { Request, Response, NextFunction } from "express";
import config from '../config/env.js';
import APIError from "../utils/APIError.js";

const requests: Record<string, { count: number; firstReq: number }> = {};

const rateLimiter = function (
    req: Request,
    res: Response,
    next: NextFunction
) {
    const org = req.headers.origin||"unknown";
    if (!requests[org]) {
        requests[org]={ count: 1, firstReq: Date.now() };
    } else {
        const timePassed = Date.now() - requests[org].firstReq;
        const rateLimit = Number(config.ratelimit);
        const rateLimitWindow = Number(config.ratelimitwindow);
        if (timePassed < rateLimitWindow) {
            if (requests[org].count >= rateLimit) {
                throw new APIError("Rate Limit Exceeded", 429);
            }
            requests[org].count++;
        } else {
            requests[org] = { count: 1, firstReq=Date.now() };
        }
    }
    next();
}

export default rateLimiter;
