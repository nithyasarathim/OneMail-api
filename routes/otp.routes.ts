import { Router } from "express";
import sendRegisterOtp from "../controllers/otp.controller.js";
import signatureValidator from "../middlewares/signatureValidator.js";
import rateLimiter from "../middlewares/rateLimiter.js";

const router = Router();

router.post("/register/send", rateLimiter, signatureValidator, sendRegisterOtp);

export default router;
