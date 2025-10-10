import { Router } from "express";
import { createOrder, getUserOrders } from "../controllers/order.controller";
import { auth } from "../middleware/auth.middleware";

const router = Router();

// Crear orden (comprar pick)
router.post("/", auth, createOrder);

// Obtener órdenes de usuario logueado
router.get("/", auth, getUserOrders);

export default router;
