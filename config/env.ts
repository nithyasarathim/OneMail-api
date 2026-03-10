import dotenv from 'dotenv';
dotenv.config();

const isProduction = process.env.ENVIRONMENT === 'production';

const config = {
port: process.env.PORT || (isProduction ? 8080 : 5002),
mail: {
host: process.env.MAIL_HOST,
port: Number(process.env.MAIL_PORT),
user: process.env.MAIL_USER,
pass: process.env.MAIL_PASS,
},
signaturesecret: isProduction ? process.env.SIGNATURE_SECRET : 'dev_secret_key',
ratelimit: Number(process.env.RATE_LIMIT) || (isProduction ? 100 : 10),
ratelimitwindow: Number(process.env.RATE_LIMIT_WINDOW) || 60000,
environment: process.env.ENVIRONMENT || 'development'
};

if (isProduction && !process.env.SIGNATURE_SECRET) {
throw new Error("FATAL ERROR: SIGNATURE_SECRET is not defined.");
}

export default config;

