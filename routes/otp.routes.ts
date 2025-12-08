import { Router } from "express";
import sendRegisterOtp from "../controllers/otp.controller.js";

const OTPRouter = Router();

OTPRouter.post("/mail/register",sendRegisterOtp);

export default OTPRouter;
