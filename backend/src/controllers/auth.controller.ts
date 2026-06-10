import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/db";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret";

// === REGISTER CONTROLLER ===
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, role } = req.body;

    // 1. Input Validation
    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required." });
      return;
    }

    // 2. Check if the user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(409).json({ error: "A user with this email already exists." });
      return;
    }

    // 3. Hash the plain-text password using a salt factor of 10
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 4. Save the user to PostgreSQL
    // Default to CUSTOMER role if not explicitly specified as AGENT
    const targetRole = role === "AGENT" ? "AGENT" : "CUSTOMER";
    const newUser = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: targetRole,
      },
    });

    // 5. Respond with success (do NOT send back the password hash!)
    res.status(201).json({
      message: "User registered successfully!",
      user: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error during registration." });
  }
};

// === LOGIN CONTROLLER ===
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // 1. Input Validation
    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required." });
      return;
    }

    // 2. Lookup the user by email
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(401).json({ error: "Invalid email or password." });
      return;
    }

    // 3. Graphically verify password matches using bcrypt's comparison method
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      res.status(401).json({ error: "Invalid email or password." });
      return;
    }

    // 4. Generate a stateless JWT payload containing the user's ID and role
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: "24h" } // Session expires automatically in 1 day
    );

    // 5. Send token to frontend client
    res.status(200).json({
      message: "Login successful!",
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error during login." });
  }
};