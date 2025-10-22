
// futuro: import { createPayPalPayment } from "./paypal.service.js";
// futuro: import { createMercadoPagoPayment } from "./mercadopago.service.js";
import { PaymentProvider } from "@prisma/client";
import { createStripePayment, verifyStripePayment } from "./stripe.service";

interface PaymentOptions {
  provider: PaymentProvider;
  amount: number;
  currency: string;
  metadata?: any;
}

export async function createPayment(options: PaymentOptions) {
  switch (options.provider) {
    case "STRIPE":
      return await createStripePayment(options.amount, options.currency, options.metadata);
    default:
      throw new Error("Proveedor de pago no soportado");
  }
}

export async function verifyPayment(provider: PaymentProvider, paymentId: string) {
  switch (provider) {
    case "STRIPE":
      return await verifyStripePayment(paymentId);
    default:
      throw new Error("Proveedor de pago no soportado");
  }
}
