import { Router } from "express";
import { sendRegisterOtp, sendForgetPasswordOtp } from "../controllers/otp.controller.js";

const OTPRouter = Router();

OTPRouter.post("/mail/register", sendRegisterOtp);
OTPRouter.post("/mail/forget-password", sendForgetPasswordOtp);

export default OTPRouter;
