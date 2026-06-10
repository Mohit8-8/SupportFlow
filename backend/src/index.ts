import express, { Request, Response } from "express";
import cors from "cors";
import "dotenv/config";
import { prisma } from "./lib/db";
import authRoutes from "./routes/auth.routes"; // 1. Import our new routes

const app = express();
const PORT = process.env.PORT || 5000;

// === MIDDLEWARES ===
app.use(cors());
app.use(express.json());

// === MOUNT ROUTERS ===
// This prefixes all authentication paths with "/api/auth"
app.use("/api/auth", authRoutes);

// === BASE HEALTH-CHECK ROUTE ===
app.get("/api/health", async (req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      status: "healthy",
      message: "Backend server is up and database is connected!",
    });
  } catch (error) {
    res.status(500).json({
      status: "unhealthy",
      message: "Server is running, but database connection failed.",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// === START SERVER ===
app.listen(PORT, () => {
  console.log(`🚀 Engine running smoothly on http://localhost:${PORT}`);
});