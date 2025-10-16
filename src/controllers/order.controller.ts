import { Request, Response } from "express";
import { prisma } from "../config/db.js";
import { sendOrderConfirmationEmail } from "../services/email.service.js";

// Crear orden (comprar pick)
export const createOrder = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { pickId, paymentId, email } = req.body;

    // Validar que venga pickId
    if (!pickId) {
      return res.status(400).json({ msg: "El campo pickId es obligatorio" });
    }

    // Si no hay usuario, debe haber email
    if (!user && !email) {
      return res.status(400).json({ msg: "Debe proporcionar un email si no hay usuario autenticado" });
    }

    // Verificar que el pick exista
    const pick = await prisma.pick.findUnique({ where: { id: pickId } });
    if (!pick) return res.status(404).json({ msg: "Pick no encontrado" });

    // Si hay usuario, verificar que no haya comprado antes ese pick
    if (user) {
      const existingOrder = await prisma.order.findFirst({
        where: { pickId, userId: user.id },
      });

      if (existingOrder) {
        return res.status(400).json({ msg: "Ya compraste este pick" });
      }
    }

    // Crear la orden
    const order = await prisma.order.create({
      data: {
        userId: user ? user.id : null,
        email: user ? user.email : email,
        pickId,
        paymentId,
        status: "paid",
      },
      include: { pick: true },
    });

    // Enviar correo de confirmación
    const emailUser = user
      ? { name: user.name, email: user.email }
      : { name: email || "cliente", email };

    await sendOrderConfirmationEmail(emailUser, order.pick.event);

    res.json({ order, ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error al crear orden", err });
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

    res.json({orders, ok: true});
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error al obtener órdenes", err });
  }
};
