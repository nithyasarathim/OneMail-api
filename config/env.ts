const dotenv = require('dotenv');
dotenv.config();

const config = {
    port: process.env.PORT,
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',')||[],
    mail: {
        host: process.env.MAIL_HOST,
        port: Number(process.env.MAIL_PORT),
        pass: process.env.MAIL_PASS,
        user: process.env.MAIL_USER,
    },
    signaturesecret: process.env.SIGNATURE_SECRET,
    ratelimit: process.env.RATE_LIMIT,
    ratelimitwindow: process.env.RATE_LIMIT_WINDOW,
};

module.exports = config;