import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import { prisma } from "../lib/db";

export const addComment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { ticketId } = req.params;
    const { content } = req.body;
    const userId = req.user?.userId;

    if (!content) {
      res.status(400).json({ error: "Comment content cannot be empty." });
      return;
    }

    if (!userId) {
      res.status(401).json({ error: "Unauthorized." });
      return;
    }

    // Diagnostic log to see exactly what parameters are arriving
    console.log("--- ATTEMPTING COMMENT CREATION ---");
    console.log("Params Ticket ID:", ticketId);
    console.log("Authenticated User ID:", userId);

    const newComment = await prisma.comment.create({
      data: {
        content,
        ticketId: ticketId as string,
        authorId: userId,
      },
      include: {
        author: { select: { email: true, role: true } }
      }
    });

    res.status(201).json({ message: "Comment added successfully!", comment: newComment });
  } catch (error) {
    // CRITICAL: Print the raw database/Prisma exception details to the terminal window
    console.error("❌ RAW PRISMA COMMENT CRASH LOG:", error);
    
    res.status(500).json({ 
      error: "Failed to drop comment into thread.",
      details: error instanceof Error ? error.message : String(error)
    });
  }
};