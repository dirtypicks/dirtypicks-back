import { google } from "googleapis";
import { ENV } from "../utils/env.js";
import { User } from "@prisma/client";

interface MailData {
  to: string, subject: string, html: string
}

const oAuth2Client = new google.auth.OAuth2(
  ENV.MAIL_GCLIENT,
  ENV.MAIL_GSECRET,
  ENV.MAIL_REDIRECT_URI
);

oAuth2Client.setCredentials({
  refresh_token: ENV.MAIL_REFRESH_TOKEN
});

const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

const sendGmailApiEmail = async (mail: MailData) => {
  try {
    const message = [
      `MIME-Version: 1.0`,
      `Content-Type: text/html; charset=UTF-8`,
      `Content-Transfer-Encoding: base64`,
      `From: ${ENV.MAIL_FROM}`,
      `To: ${mail.to}`,
      `Subject: =?UTF-8?B?${Buffer.from(mail.subject, "utf-8").toString("base64")}?=`,
      "",
      mail.html,
    ].join("\n");

    const encodedMessage = Buffer.from(message, "utf-8")
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: encodedMessage,
      },
    });
  } catch (error) {
    console.error("Error en al enviar correo:", error);
    throw error;
  }

};

const wrapEmailContent = (content: string, title: string = "DirtyPicks") => {
  return `
  <!DOCTYPE html>
  <html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    <style>
      body {
        background-color: #f6f8fb;
        color: #333;
        font-family: 'Helvetica Neue', Arial, sans-serif;
        margin: 0;
        padding: 0;
      }
      .container {
        max-width: 520px;
        margin: 40px auto;
        background-color: #fff;
        border-radius: 12px;
        box-shadow: 0 4px 10px rgba(0,0,0,0.05);
        overflow: hidden;
      }
      .header {
        background: #0d1117;
        color: #fff;
        padding: 18px;
        text-align: center;
        font-size: 22px;
        font-weight: bold;
      }
      .content {
        padding: 28px;
        line-height: 1.6;
      }
      .button {
        display: inline-block;
        background-color: #007bff;
        color: #fff !important;
        padding: 10px 18px;
        border-radius: 8px;
        text-decoration: none;
        margin-top: 16px;
      }
      .footer {
        text-align: center;
        font-size: 12px;
        color: #999;
        padding: 20px;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">DirtyPicks</div>
      <div class="content">
        ${content}
      </div>
      <div class="footer">
        © ${new Date().getFullYear()} DirtyPicks. Todos los derechos reservados.
      </div>
    </div>
  </body>
  </html>
  `;
};

export const sendVerificationEmail = async (user: User, token: string) => {
  try {
    const verifyUrl = `${ENV.FRONT_HOST}/verify-email?token=${token}`;

    const content = `
          <h2>¡Hola ${user.name}!</h2>
          <p>Gracias por registrarte en <strong>DirtyPicks</strong>.</p>
          <p>Haz clic en el siguiente botón para verificar tu cuenta:</p>
          <p>
            <a href="${verifyUrl}" class="button" target="_blank">
              Verificar correo
            </a>
          </p>
          <p>Este enlace expirará en 1 hora.</p>
        `;

    const html = wrapEmailContent(content, "Verifica tu correo - DirtyPicks");

    const mailOptions = {
      to: user.email,
      subject: "Verifica tu correo electrónico - DirtyPicks",
      html,
    };

    return sendGmailApiEmail(mailOptions);
  } catch (error) {
    console.error("Error en sendVerificationEmail:", error);
    throw error;
  }
};

/**
 * 🔐 Enviar correo para reestablecer contraseña
 */
export const sendResetPasswordEmail = async (user: User, token: string) => {
  try {
    const resetUrl = `${ENV.FRONT_HOST}/reset-password?token=${token}`;

    const content = `
          <h2>Solicitud de reestablecimiento de contraseña</h2>
          <p>Hola <strong>${user.name}</strong>, solicitaste reestablecer tu contraseña.</p>
          <p>Haz clic en el siguiente botón para continuar (válido por 15 minutos):</p>
          <p>
            <a href="${resetUrl}" class="button" target="_blank">
              Reestablecer contraseña
            </a>
          </p>
          <p>Si no solicitaste este cambio, ignora este mensaje.</p>
        `;

    const html = wrapEmailContent(content, "Reestablecer contraseña - DirtyPicks");

    const mailOptions = {
      to: user.email,
      subject: "Reestablecer contraseña - DirtyPicks",
      html: html,
    };

    return sendGmailApiEmail(mailOptions);
  } catch (error) {
    console.error("Error en sendResetPasswordEmail:", error);
    throw new Error("No se pudo enviar el correo de recuperación");
  }
};

/**
 * 🧱 Enviar confirmación de compra (Ejemplo opcional)
 */

interface EmailUser {
  name: string;
  email: string;
}

export const sendOrderConfirmationEmail = async (user: EmailUser, pickTitle: string) => {
  try {
    const content = `
      <h2>Gracias por tu compra, ${user.name || "amigo"}!</h2>
      <p>Tu pick <strong>${pickTitle}</strong> ya está disponible para ti}.</p>
      <p>¡Te deseamos mucha suerte 🍀!</p>
    `;

    const html = wrapEmailContent(content, "Confirmación de compra - DirtyPicks");

    const mailOptions = {
      to: user.email,
      subject: "Confirmación de compra - DirtyPicks",
      html,
    };

    return sendGmailApiEmail(mailOptions);
  } catch (error) {
    console.error("Error en sendOrderConfirmationEmail:", error);
    throw new Error("No se pudo enviar el correo de confirmación");
  }
};