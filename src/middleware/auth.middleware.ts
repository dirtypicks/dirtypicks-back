import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../config/db.js";

interface JwtPayload { id: string; role: string; }

export const auth = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ msg: "No autorizado" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "default") as JwtPayload;
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) return res.status(401).json({ msg: "Usuario no encontrado" });

    (req as any).user = user;
    next();
  } catch {
    res.status(401).json({ msg: "Token inválido" });
  }
};

export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    (req as any).user = null;
    return next();
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    (req as any).user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "default") as JwtPayload;
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    (req as any).user = user || null;
  } catch {
    (req as any).user = null;
  }

  next();
};
