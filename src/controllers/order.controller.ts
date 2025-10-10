import { Request, Response } from "express";
import { prisma } from "../config/db";

// Crear orden (comprar pick)
export const createOrder = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { pickId, paymentId } = req.body;

    // Verificar que el pick exista
    const pick = await prisma.pick.findUnique({ where: { id: pickId } });
    if (!pick) return res.status(404).json({ msg: "Pick no encontrado" });

    // Verificar si el usuario ya compró este pick
    const existingOrder = await prisma.order.findFirst({
      where: { pickId, userId: user.id },
    });

    if (existingOrder) {
      return res.status(400).json({ msg: "Ya compraste este pick" });
    }

    // Crear la orden
    const order = await prisma.order.create({
      data: {
        userId: user.id,
        pickId,
        paymentId,
        status: "paid",
      },
      include: { pick: true }, // opcional: incluir info del pick
    });

    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error al crear orden" });
  }
};

// Obtener órdenes de usuario logueado
export const getUserOrders = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    const orders = await prisma.order.findMany({
      where: { userId: user.id },
      include: { pick: true },
    });

    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error al obtener órdenes" });
  }
};
