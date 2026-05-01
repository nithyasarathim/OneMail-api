import { Router } from "express";
import { sendRegisterOtp, sendForgetPasswordOtp } from "../controllers/otp.controller.js";
import signatureValidator from "../middlewares/signatureValidator.js";

const OTPRouter = Router();

OTPRouter.post("/mail/register", signatureValidator, sendRegisterOtp);
OTPRouter.post("/mail/forget-password", signatureValidator, sendForgetPasswordOtp);

export default OTPRouter;
