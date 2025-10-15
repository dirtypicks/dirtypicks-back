import { prisma } from "../config/db.js";
import bcrypt from "bcryptjs";
import { Request, Response } from "express";
import { generateEmailVerificationToken, generateResetToken, generateToken, markTokenAsUsed, verifyToken } from "../utils/token.js";
import { sendResetPasswordEmail, sendVerificationEmail } from "../services/email.service.js";
import { TokenType } from "@prisma/client";

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    const existsemail = await prisma.user.findUnique({ where: { email } });
    if (existsemail) return res.status(400).json({ msg: "Email ya registrado" });
    const existsUser = await prisma.user.findUnique({ where: { name } });
    if (existsUser) return res.status(400).json({ msg: "Nombre de usuario ya registrado" });
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        msg: "La contraseña debe tener mínimo 8 caracteres, e incluir al menos una mayúscula, una minúscula, un número y un carácter especial.",
      });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { name, email, password: hashed } });
    //addUserAudience(user);
    const token = await generateEmailVerificationToken(user.id);
    await sendVerificationEmail(user, token);

    res.json({ msg: "Usuario creado", user });
  } catch (err) {
    console.log("Error al registrar usuario", err);
    res.status(500).json({ msg: "Error al registrar", err });
  }
};

export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ msg: "Token no proporcionado" });

    // Verificamos token de tipo VERIFY_EMAIL
    const decoded: any = await verifyToken(token, TokenType.VERIFY_EMAIL);

    // Actualizamos usuario: email verificado
    await prisma.user.update({
      where: { id: decoded.userId },
      data: { verified: true },
    });

    // Marcamos token como usado
    await markTokenAsUsed(token);

    return res.json({ msg: "Correo electrónico verificado correctamente" });
  } catch (err: any) {
    return res.status(400).json({ msg: err.message || "Token inválido o expirado" });
  }
};

// 📩 Reenviar verificación de correo (por si el usuario no verificó a tiempo)
export const resendVerificationEmail = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email)
      return res.status(400).json({ msg: "El correo es requerido."});

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user)
      return res.status(404).json({ msg: "Usuario no encontrado."});

    if (user.verified)
      return res.status(400).json({ msg: "Este usuario ya está verificado."});

    const token = await generateEmailVerificationToken(user.id);
    await sendVerificationEmail(user, token);

    res.json({ msg: "Correo de verificación reenviado exitosamente.", ok: true });
  } catch (err) {
    console.error("Error reenviando correo de verificación:", err);
    res.status(500).json({ msg: "Error al reenviar correo de verificación.", err});
  }
};


export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ msg: "Usuario no encontrado"});

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ msg: "Contraseña incorrecta"});

    if (!user.verified) {
      return res.status(403).json({ msg: "Debes verificar tu correo antes de iniciar sesión"});
    }

    const token = generateToken(user.id, user.role);
    res.json({ token, user, ok: true });
  } catch(err) {
    res.status(500).json({ msg: "Error al iniciar sesión", err});
  }
};

export const requestPasswordReset = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ msg: "Email requerido"});

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ msg: "Usuario no encontrado"});

    const resetToken = await generateResetToken(user.id);

    await sendResetPasswordEmail(user, resetToken);

    return res.json({ msg: "Correo de restablecimiento enviado", ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: "Error al solicitar restablecimiento", err});
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword)
      return res.status(400).json({ msg: "Datos incompletos"});

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        msg: "La contraseña debe tener mínimo 8 caracteres, e incluir al menos una mayúscula, una minúscula, un número y un carácter especial.",
      });
    }

    // Verificamos token y tipo
    const decoded = await verifyToken(token, TokenType.PASSWORD_RESET);

    // Hasheamos la nueva contraseña
    const hashed = await bcrypt.hash(newPassword, 10);

    // Actualizamos contraseña en usuario
    await prisma.user.update({
      where: { id: decoded.userId },
      data: { password: hashed },
    });

    // Marcamos token como usado
    await markTokenAsUsed(token);

    return res.json({ msg: "Contraseña actualizada correctamente", ok: true });
  } catch (err: any) {
    // Devolvemos mensaje directo al usuario
    return res.status(400).json({ msg: err.message || "Token inválido o expirado"});
  }
};
