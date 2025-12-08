import nodemailer from "nodemailer";
import config from "./env.js";

const transporter = nodemailer.createTransport({
  host: config.mail.host,
  port: config.mail.port,
  secure: false,
  auth: {
    user: config.mail.user,
    pass: config.mail.pass,
  },
  tls: {
    rejectUnauthorized:false,
  }
});

export default transporter;
