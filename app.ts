import express from "express";
import OTPRouter from "./routes/otp.routes.js";
import requestLogger from "./middlewares/requestLogger.js";
import signatureValidator from "./middlewares/signatureValidator.js";
import rateLimiter from "./middlewares/rateLimiter.js";
import errorHandler from "./middlewares/errorHandler.js";
import type { Request,Response } from "express";

const app = express();

app.use(express.json());
app.use(requestLogger);


app.get("/", (req: Request, res: Response) => {
    res.status(200).json({
        success: true,
        message:"Auth Mail server is alive on this port"
    })
})
 

app.use('/otp', rateLimiter ,signatureValidator, OTPRouter);
app.use(errorHandler);

export default app;
