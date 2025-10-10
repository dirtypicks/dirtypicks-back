// src/routes/auth.routes.ts
import express from "express";
import {
  register,
  login,
  requestPasswordReset,
  resetPassword,
  verifyEmail, // 👈 nueva función
  resendVerificationEmail // 👈 reenviar verificación
} from "../controllers/auth.controller.js";

const router = express.Router();

// Registro y login
router.post("/register", register);
router.post("/login", login);

// Verificación de correo
router.post("/verify-email", verifyEmail);
router.post("/resend-verification", resendVerificationEmail);

// Recuperación de contraseña
router.post("/request-password-reset", requestPasswordReset);
router.post("/reset-password", resetPassword);

export default router;
