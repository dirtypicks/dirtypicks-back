import Stripe from "stripe";
import { ENV } from "../utils/env.js";

const stripe = new Stripe(ENV.STRIPE_SECRET_KEY);

export async function createStripePayment(amount: number, currency: string, metadata: any) {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // convierte a centavos
    currency,
    metadata,
    automatic_payment_methods: { enabled: true },
  });

  return paymentIntent;
}

export async function verifyStripePayment(paymentIntentId: string) {
  const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
  return intent.status === "succeeded";
}
