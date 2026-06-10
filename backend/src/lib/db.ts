import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import "dotenv/config";

// 1. Establish a standard PostgreSQL connection pool using our environment string
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// 2. Wrap that pool inside the Prisma 7 Postgres Adapter
const adapter = new PrismaPg(pool);

// 3. Export a single, global instance of the Prisma Client configured to use this adapter
export const prisma = new PrismaClient({ adapter });