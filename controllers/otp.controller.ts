import type { Request, Response, NextFunction } from "express";
import transporter from "../config/mailer.js";
import signInOtpTemplate from '../templates/signin-otp.template.js';
import forgetPasswordOtpTemplate from "../templates/forgetPwd-otp.template.js";
import config from "../config/env.js";
import APIError from "../utils/APIError.js";

const sendRegisterOtp = async function (
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const { to, otp } = req.body;
        const html = signInOtpTemplate(otp);
        await transporter.sendMail({
            from: `"OneAuth Registration" <${config.mail.user}>`,
            to,
            subject: "OneAccounts Registration One Time Password",
            html,
        });
        return res.status(200).json({ message: "Mail sent successfully", success: true });
    } catch (err) {
        console.log(err);
        return next(new APIError("Failed to send OTP", 500));
    }
};

const sendForgetPasswordOtp = async function (
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const { to, otp } = req.body;
        const html = forgetPasswordOtpTemplate(otp);
        await transporter.sendMail({
            from: `"OneAuth Reset Password" <${config.mail.user}>`,
            to,
            subject: "OneAccounts Reset Password One Time Password",
            html,
        });
        return res.status(200).json({ message: "Mail sent successfully", success: true });
    } catch (err) {
        console.log(err);
        return next(new APIError("Failed to send OTP", 500));
    }
};

export {
    sendForgetPasswordOtp,
    sendRegisterOtp
}