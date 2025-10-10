import { Request, Response } from "express";
import { prisma } from "../config/db";

// Listado público
export const getAllPicks = async (req: Request, res: Response) => {
  try {
    const picks = await prisma.pick.findMany({
      where: { visible: true }
    });
    res.json(picks);
  } catch (err) {
    res.status(500).json({ msg: "Error al obtener picks" });
  }
};

// Obtener pick por ID
export const getPickById = async (req: Request, res: Response) => {
  try {
    const pick = await prisma.pick.findUnique({
      where: { id: req.params.id }
    });
    if (!pick) return res.status(404).json({ msg: "Pick no encontrado" });
    res.json(pick);
  } catch (err) {
    res.status(500).json({ msg: "Error al obtener pick" });
  }
};

// Crear pick (solo admin)
export const createPick = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (user.role !== "admin") return res.status(403).json({ msg: "No tienes privilegios para esta acción" });

    const { sport, league, event, description, price, fullPick, url } = req.body;
    const pick = await prisma.pick.create({
      data: { sport, league, event, description, price, fullPick, url }
    });
    res.json(pick);
  } catch (err) {
    res.status(500).json({ msg: "Error al crear pick", err });
  }
};

// Actualizar pick (solo admin)
export const updatePick = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (user.role !== "admin") return res.status(403).json({ msg: "No tienes privilegios para esta acción" });

    const { sport, league, event, description, price, fullPick, url, visible, status } = req.body;
    const pick = await prisma.pick.update({
      where: { id: req.params.id },
      data: { sport, league, event, description, price, fullPick, url, visible, status }
    });
    res.json(pick);
  } catch (err) {
    res.status(500).json({ msg: "Error al actualizar pick", err });
  }
};

// Eliminar pick (solo admin)
export const deletePick = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (user.role !== "admin") return res.status(403).json({ msg: "No tienes privilegios para esta acción" });

    await prisma.pick.delete({ where: { id: req.params.id } });
    res.json({ msg: "Pick eliminado" });
  } catch (err) {
    res.status(500).json({ msg: "Error al eliminar pick" });
  }
};
