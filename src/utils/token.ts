import jwt from "jsonwebtoken";
import { prisma } from "../config/db.js";
import { TokenType } from "@prisma/client";

/**
 * Token general de autenticación (para login)
 */
export const generateToken = (id: string, role: string) => {
  try {
    const secret = process.env.JWT_SECRET || "default";
    return jwt.sign({ id, role }, secret, { expiresIn: "7d" });
  } catch (err) {
    console.error("Error generando token:", err);
    throw new Error("Error generando token");

  }

};

/**
 * Crea un token de tipo PASSWORD_RESET y lo guarda en BD
 */
export const generateResetToken = async (userId: string) => {
  try {
    const token = jwt.sign({ userId }, process.env.JWT_SECRET!, {
      expiresIn: "15m",
    });
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 min
    await prisma.token.create({
      data: {
        userId,
        token,
        type: TokenType.PASSWORD_RESET,
        expiresAt,
      },
    });
    return token;
  } catch (err) {
    console.error("Error verificando token:", err);
    throw err;
  }
};

/**
 * Crea un token de verificación de email y lo guarda en BD
 */
export const generateEmailVerificationToken = async (userId: string) => {
  try {
    const token = jwt.sign({ userId }, process.env.JWT_SECRET!, {
      expiresIn: "1h",
    });

    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    await prisma.token.create({
      data: {
        userId,
        token,
        type: TokenType.VERIFY_EMAIL,
        expiresAt,
      },
    });

    return token;
  } catch (err) {
    console.error("Error creando token:", err);
    throw err;
  }
};

/**
 * Verifica un token JWT genérico y comprueba si existe en BD
 */
export const verifyToken = async (token: string, type: TokenType) => {
  try {
    // Verificar firma y expiración JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };

    // Verificar en base de datos
    const dbToken = await prisma.token.findUnique({
      where: { token },
      include: { user: true }
    });

    if (!dbToken)
      throw new Error("Token no encontrado en base de datos");

    if (dbToken.used)
      throw new Error("Token ya fue utilizado");

    if (dbToken.type !== type)
      throw new Error("Tipo de token inválido");

    if (dbToken.expiresAt < new Date())
      throw new Error("Token expirado");

    return decoded;
  } catch (err) {
    console.error("Error verificando token:", err);
    throw err;
  }
};

/**
 * Marca un token como usado después de consumirlo
 */
export const markTokenAsUsed = async (token: string) => {
  try {
    await prisma.token.update({
      where: { token },
      data: { used: true },
    });
  } catch (err) {
    console.error("Error al marcar token como usado:", err);
    throw err;
  }
};
