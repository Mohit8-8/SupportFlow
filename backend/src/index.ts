import express, { Request, Response } from "express";
import cors from "cors";
import "dotenv/config";
import { prisma } from "./lib/db";
import authRoutes from "./routes/auth.routes";
import ticketRoutes from "./routes/ticket.routes"; // 1. Import ticket routes

const app = express();
const PORT = process.env.PORT || 5000;

// === MIDDLEWARES ===
app.use(cors());
app.use(express.json());

// === MOUNT ROUTERS ===
app.use("/api/auth", authRoutes);
app.use("/api/tickets", ticketRoutes); // 2. Mount ticket routes

// === BASE HEALTH-CHECK ROUTE ===
app.get("/api/health", async (req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: "healthy", message: "Backend server is up!" });
  } catch (error) {
    res.status(500).json({ status: "unhealthy", error: String(error) });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Engine running smoothly on http://localhost:${PORT}`);
});