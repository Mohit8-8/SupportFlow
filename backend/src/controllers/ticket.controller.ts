import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import { prisma } from "../lib/db";
import { analyzeTicketWithAI } from "../services/ai.service";

// === 1. CREATE TICKET ===
export const createTicket = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { title, description } = req.body;
    if (!title || !description) {
      res.status(400).json({ error: "Title and description are required." });
      return;
    }

    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized." });
      return;
    }

    const aiAnalysis = await analyzeTicketWithAI(title, description);

    const newTicket = await prisma.ticket.create({
      data: {
        title,
        description,
        category: aiAnalysis.category,
        priority: aiAnalysis.priority,
        suggestedResponse: aiAnalysis.suggestedResponse,
        createdById: userId,
      },
    });

    res.status(201).json({ message: "Ticket created successfully!", ticket: newTicket });
  } catch (error) {
    res.status(500).json({ error: "Internal server error while processing ticket." });
  }
};

// === 2. GET ALL TICKETS (WITH AUTOMATIC ROLE FILTERING) ===
export const getTickets = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const role = req.user?.role;

    let tickets;
    if (role === "AGENT") {
      tickets = await prisma.ticket.findMany({
        include: { 
          createdBy: { select: { email: true } },
          comments: { 
            include: { author: { select: { email: true, role: true } } },
            orderBy: { createdAt: "asc" } // Oldest messages first (standard chat layout)
          }
        },
        orderBy: { createdAt: "desc" },
      });
    } else {
      tickets = await prisma.ticket.findMany({
        where: { createdById: userId },
        include: {
          comments: {
            include: { author: { select: { email: true, role: true } } },
            orderBy: { createdAt: "asc" }
          }
        },
        orderBy: { createdAt: "desc" },
      });
    }

    res.status(200).json(tickets);
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve tickets." });
  }
};

// === 3. UPDATE TICKET STATUS / ASSIGNEE ===
export const updateTicket = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, priority, assignedToId } = req.body;

    const updatedTicket = await prisma.ticket.update({
      where: { id: id as string},
      data: {
        ...(status && { status }),
        ...(priority && { priority }),
        ...(assignedToId && { assignedToId }),
      },
    });

    res.status(200).json({ message: "Ticket updated successfully", ticket: updatedTicket });
  } catch (error) {
    res.status(500).json({ error: "Failed to update ticket configuration." });
  }
};