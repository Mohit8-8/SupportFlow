import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// FIX: Using Prisma's built-in env helper instead of process.env to satisfy TypeScript
console.log("=== PRISMA DEBUG ===");
console.log("DATABASE_URL VALUE IS:", env("DATABASE_URL"));
console.log("====================");

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});