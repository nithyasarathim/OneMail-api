import express from "express";
import OTPRouter from "./routes/otp.routes.js";
import requestLogger from "./middlewares/requestLogger.js";
import signatureValidator from "./middlewares/signatureValidator.js";
import rateLimiter from "./middlewares/rateLimiter.js";
import errorHandler from "./middlewares/errorHandler.js";

const app = express();

app.use(express.json());
app.use(requestLogger);
app.use('/otp', rateLimiter ,signatureValidator, OTPRouter);
app.use(errorHandler);

export default app;
