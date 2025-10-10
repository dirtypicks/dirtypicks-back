import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes";
import pickRoutes from "./routes/pick.routes";
import orderRoutes from "./routes/order.routes";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/picks", pickRoutes);
app.use("/api/orders", orderRoutes);

export default app;
