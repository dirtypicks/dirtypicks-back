import { Router } from "express";
import { getAllPicks, getPickById, createPick, updatePick, deletePick } from "../controllers/pick.controller.js";
import { auth } from "../middleware/auth.middleware.js";

const router = Router();

// Solo listado público
router.get("/", getAllPicks);
router.get("/:id", getPickById);

// CRUD protegido (solo admin)
router.post("/", auth, createPick);
router.put("/:id", auth, updatePick);
router.delete("/:id", auth, deletePick);

export default router;
