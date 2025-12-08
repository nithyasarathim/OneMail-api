    import rateLimit from 'express-rate-limit';
    import config from '../config/env.js';
    import type { Request } from 'express';
    import APIError from "../utils/APIError.js";

    const WINDOW_MS = Number(config.ratelimitwindow);
    const MAX_REQUESTS = Number(config.ratelimit);

    const rateLimiter = rateLimit({
        windowMs: WINDOW_MS,
        max: MAX_REQUESTS,
        standardHeaders: true,
        legacyHeaders: false,
        keyGenerator: (req: Request) => req.ip!,
        handler: (req, res, next) => {
            throw new APIError("Too many requests", 429);
        },
    });

    export default rateLimiter;
