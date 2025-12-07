const nodemailer = require("nodemailer");
const config = require("./env");

const transporter = nodemailer.createTransport({
  host: config.mail.host,
  port: config.mail.port,
  secure: false,
  auth: {
    user: config.mail.user,
    pass: config.mail.pass,
  },
});

module.exports = transporter;
