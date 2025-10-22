import { Router } from "express";
import { createOrder, generatePayment, getUserOrders } from "../controllers/order.controller.js";
import { auth, optionalAuth } from "../middleware/auth.middleware.js";

const router = Router();

// Crear orden (comprar pick)
//router.post("/", optionalAuth, createOrder);

//Create payment
router.post("/", optionalAuth, generatePayment);

// Obtener órdenes de usuario logueado
router.get("/", auth, getUserOrders);

export default router;
