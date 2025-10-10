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
