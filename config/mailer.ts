import nodemailer from "nodemailer";
import config from "./env.js";

const isProduction = config.environment === "production";

const transporter = nodemailer.createTransport({
  host: config.mail.host,
  port: config.mail.port,
  secure: isProduction ? true : false,
  auth: {
    user: config.mail.user,
    pass: config.mail.pass,
  },
  tls: {
    rejectUnauthorized: isProduction ? true : false,
  },
});

export default transporter;
