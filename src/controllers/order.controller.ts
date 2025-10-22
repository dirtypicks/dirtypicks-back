import { Request, Response } from "express";
import { prisma } from "../config/db.js";
import { sendOrderConfirmationEmail } from "../services/email.service.js";
import { createPayment, verifyPayment } from "../services/payment.service.js";
import { PaymentProvider, PaymentStatus } from "@prisma/client";
import { ENV } from "utils/env.js";

export const createOrder = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { pickId, email, provider } = req.body; // provider = "STRIPE" | "PAYPAL" | "MERCADOPAGO"

    if (!pickId) return res.status(400).json({ msg: "El campo pickId es obligatorio" });
    if (!provider) return res.status(400).json({ msg: "Debe indicar el proveedor de pago" });

    if (!user && !email) {
      return res.status(400).json({ msg: "Debe proporcionar un email si no hay usuario autenticado" });
    }

    const pick = await prisma.pick.findUnique({ where: { id: pickId } });
    if (!pick) return res.status(404).json({ msg: "Pick no encontrado" });

    if (user) {
      const existingOrder = await prisma.order.findFirst({
        where: { pickId, userId: user.id },
      });
      if (existingOrder) return res.status(400).json({ msg: "Ya compraste este pick" });
    }

    // Crear intención de pago
    const paymentIntent = await createPayment({
      provider,
      amount: pick.price,
      currency: "mxn",
      metadata: { pickId, userId: user?.id || null },
    });

    // Crear orden PENDIENTE en la base de datos
    const order = await prisma.order.create({
      data: {
        userId: user ? user.id : null,
        email: user ? user.email : email,
        pickId,
        amount: pick.price,
        currency: "MXN",
        paymentProvider: provider,
        paymentProviderId: paymentIntent.id,
        paymentStatus: PaymentStatus.PENDING,
      },
    });

    res.json({
      ok: true,
      clientSecret: paymentIntent.client_secret,
      orderId: order.id,
      publishableKey: ENV.STRIPE_PUBLIC_KEY,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error al crear orden", err });
  }
};

// 🔄 Endpoint para confirmar pago exitoso (webhook o client-side)
export const confirmOrderPayment = async (req: Request, res: Response) => {
  try {
    const { paymentProvider, paymentId, orderId } = req.body;

    const isPaid = await verifyPayment(paymentProvider, paymentId);
    if (!isPaid) return res.status(400).json({ msg: "Pago no confirmado" });

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { paymentStatus: "PAID" },
      include: { pick: true },
    });

    await sendOrderConfirmationEmail(
      { name: updatedOrder.email || "Cliente", email: updatedOrder.email! },
      updatedOrder.pick.event, updatedOrder
    );

    res.json({ ok: true, order: updatedOrder });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error al confirmar pago", err });
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
