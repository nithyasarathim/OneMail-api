import type { Request, Response, NextFunction } from 'express';

const requestLogger = function (
    req: Request,
    res: Response,
    next: NextFunction
) {
    const start = Date.now();
    res.on("finish", () => {
        const duration = Date.now() - start;
        const ip = req.ip || "unknown";
        console.log(
            `${new Date().toISOString()} │ ` +
            `${ip.padEnd(15)} │ ` +
            `${req.method.padEnd(6)} │ ` +
            `${String(res.statusCode).padStart(3)} │ ` +
            `${duration.toString().padStart(4)}ms │ ` +
            `${req.originalUrl}`
        )
    });
    next();
};

export default requestLogger;