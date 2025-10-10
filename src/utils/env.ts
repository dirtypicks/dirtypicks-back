import dotenv from "dotenv";
dotenv.config();

const p = process.env;

export const ENV = {
    APP_PORT: p.PORT || 4000,
    APP_HOST: p.HOST || "http://localhost",
    MAIL_DOMAIN: p.MAILGUN_DOMAIN!,
    MAIL_FROM: p.MAIL_FROM || "dirtypicksmx@gmail.com",
    FRONT_HOST: p.FRONT_HOST,
    MAIL_CLIENT: p.MAIL_CLIENT,
    MAIL_SECRET: p.MAIL_SECRET
}