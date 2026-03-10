import express from "express";
import OTPRouter from "./routes/otp.routes.js";
import requestLogger from "./middlewares/requestLogger.js";
import rateLimiter from "./middlewares/rateLimiter.js";
import errorHandler from "./middlewares/errorHandler.js";
import config from "./config/env.js";
import type { Request, Response } from "express";

const app = express();
const isProduction = config.environment === "production";

isProduction && app.set("trust proxy", 1);

app.use(express.json({ limit: isProduction ? "10kb" : "1mb" }));
app.use(requestLogger);

app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "Auth Mail server is alive",
    env: isProduction ? "production" : "development",
  });
});

app.use("/otp", rateLimiter, OTPRouter);

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

app.use(errorHandler);

export default app;
