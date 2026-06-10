import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret";

// We extend Express's native Request interface so TypeScript knows it's safe 
// to attach user details directly to the request object.
export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    role: "CUSTOMER" | "AGENT";
  };
}

export const authenticateToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  // 1. Extract the Authorization header (Format: "Bearer TOKEN_STRING")
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  // If no token is provided, deny access immediately
  if (!token) {
    res.status(401).json({ error: "Access denied. No token provided." });
    return;
  }

  try {
    // 2. Cryptographically verify the token using our server's secret key
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: "CUSTOMER" | "AGENT" };
    
    // 3. Attach the decoded payload to the request object so subsequent controllers can use it
    req.user = {
      userId: decoded.userId,
      role: decoded.role
    };

    // 4. Pass control to the next function in line (the controller)
    next();
  } catch (error) {
    res.status(403).json({ error: "Invalid or expired token." });
  }
};

// Role authorization guard: Ensures only specific roles can access a route
export const requireRole = (role: "CUSTOMER" | "AGENT") => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user || req.user.role !== role) {
      res.status(403).json({ error: `Forbidden. Requires an ${role} account.` });
      return;
    }
    next();
  };
};