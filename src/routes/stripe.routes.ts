import express from "express";
import Stripe from "stripe";
import { prisma } from "../config/db.js";
import { sendOrderConfirmationEmail } from "../services/email.service.js";
import { ENV } from "../utils/env.js";

const router = express.Router();
const stripe = new Stripe(ENV.STRIPE_SECRET_KEY, { apiVersion: "2025-09-30.clover" });

/* router.post(
    "/stripe",
    express.raw({ type: "application/json" }), // 👈 importante: no usar express.json() aquí
    async (req, res) => {
        const sig = req.headers["stripe-signature"];
        if (!sig) return res.status(400).send("No signature");

        let event: Stripe.Event;

        try {
            event = stripe.webhooks.constructEvent(req.body, sig, ENV.STRIPE_WEBHOOK_SECRET);
        } catch (err: any) {
            console.error("⚠️ Webhook error:", err.message);
            return res.status(400).send(`Webhook Error: ${err.message}`);
        }

        // 🔍 Manejar eventos importantes
        try {
            switch (event.type) {
                case "payment_intent.succeeded": {
                    const intent = event.data.object as Stripe.PaymentIntent;
                    const order = await prisma.order.findFirst({
                        where: { paymentProviderId: intent.id },
                        include: { pick: true },
                    });
                    if (!order) break;

                    await prisma.order.update({
                        where: { id: order.id },
                        data: { paymentStatus: "PAID" },
                    });

                    await sendOrderConfirmationEmail(
                        { name: order.email || "Cliente", email: order.email! },
                        order.pick.event, order
                    );

                    console.log(`✅ Orden ${order.id} marcada como pagada`);
                    break;
                }

                case "payment_intent.payment_failed": {
                    const intent = event.data.object as Stripe.PaymentIntent;
                    await prisma.order.updateMany({
                        where: { paymentProviderId: intent.id },
                        data: { paymentStatus: "FAILED" },
                    });
                    console.log(`❌ Pago fallido para ${intent.id}`);
                    break;
                }

                case "payment_intent.created": {
                    const intent = event.data.object as Stripe.PaymentIntent;

                    // Buscar la orden en tu base de datos
                    const order = await prisma.order.findFirst({
                        where: { paymentProviderId: intent.id },
                    });

                    if (order) {
                        console.log(`📌 PaymentIntent creado para la orden ${order.id}`);
                        // Opcional: actualizar algún campo si quieres trackear que se generó el PaymentIntent
                        await prisma.order.update({
                            where: { id: order.id },
                            data: { paymentStatus: "PENDING" }, // ya debería estar PENDING, solo por si acaso
                        });
                    } else {
                        console.log(`⚠️ PaymentIntent creado pero no se encontró orden para ${intent.id}`);
                    }

                    break;
                }

                default:
                    console.log(`Unhandled event type ${event.type}`);
            }

            res.status(200).send("ok");
        } catch (err) {
            console.error("Error procesando webhook:", err);
            res.status(500).send("Webhook handler failed");
        }
    }
); */

router.post(
  "/stripe",
  express.raw({ type: "application/json" }), // 👈 necesario para Stripe
  async (req, res) => {
    const sig = req.headers["stripe-signature"];
    if (!sig) return res.status(400).send("No signature");

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        ENV.STRIPE_WEBHOOK_SECRET
      );
    } catch (err: any) {
      console.error("⚠️ Webhook error:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      console.log(event.type)
      switch (event.type) {
        // ✅ Pago completado
        case "payment_intent.succeeded": {
          const intent = event.data.object as Stripe.PaymentIntent;
          const metadata = intent.metadata || {};

          // Buscar el pickId (debería estar en metadata)
          const pickId = metadata.pickId;
          const userId = metadata.userId || null;
          const email = metadata.email;
          const amount = metadata.amount;

          // Crear la orden ya pagada
          const order = await prisma.order.create({
            data: {
              pickId,
              userId,
              email,
              paymentProvider: "STRIPE",
              paymentProviderId: intent.id,
              paymentStatus: "PAID",
              amount: parseFloat(amount || "0"),
            },
            include: { pick: true, user: true },
          });
          
          // Enviar correo
          await sendOrderConfirmationEmail(order);

          console.log(`✅ Orden ${order.id} creada y marcada como pagada`);
          break;
        }

        // ❌ Pago fallido
        case "payment_intent.payment_failed": {
          const intent = event.data.object as Stripe.PaymentIntent;
          console.log(`❌ Pago fallido para ${intent.id}`);
          break;
        }

        // 🔍 PaymentIntent creado (solo log)
        case "payment_intent.created": {
          const intent = event.data.object as Stripe.PaymentIntent;
          console.log(`📌 PaymentIntent creado: ${intent.id}`);
          break;
        }

        default:
          console.log(`Unhandled event type ${event.type}`);
      }

      res.status(200).send("ok");
    } catch (err) {
      console.error("Error procesando webhook:", err);
      res.status(500).send("Webhook handler failed");
    }
  }
);


export default router;
