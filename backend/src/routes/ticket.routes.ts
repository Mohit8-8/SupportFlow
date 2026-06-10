import { Router } from "express";
import { createTicket, getTickets, updateTicket } from "../controllers/ticket.controller";
import { addComment } from "../controllers/comment.controller";
import { authenticateToken } from "../middlewares/auth.middleware";

const router = Router();

// Apply auth token validation universally to all sub-routes
router.use(authenticateToken as any);

router.post("/", createTicket as any);
router.get("/", getTickets as any);
router.patch("/:id", updateTicket as any);

// Conversation thread route
router.post("/:ticketId/comments", addComment as any);

export default router;