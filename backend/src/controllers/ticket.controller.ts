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
    
    // 1. Extract query parameters from the URL
    const { page = 1, limit = 10, search, status, priority } = req.query;
    const pageNum = Number(page);
    const take = Number(limit);
    const skip = (pageNum - 1) * take;

    // 2. Build a dynamic filtering object for Prisma
    let whereClause: any = {};

    // Customers only see their own tickets
    if (role === "CUSTOMER") {
      whereClause.createdById = userId;
    }

    // Apply strict filters if provided
    if (status) whereClause.status = status;
    if (priority) whereClause.priority = priority;
    
    // Apply wildcard text search across Title and Description
    if (search) {
      whereClause.OR = [
        { title: { contains: String(search), mode: "insensitive" } },
        { description: { contains: String(search), mode: "insensitive" } }
      ];
    }

    // 3. Run the filtered query and count total items for pagination
    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where: whereClause,
        include: { 
          createdBy: { select: { email: true } },
          assignedTo: { select: { email: true } }, // Include Assignee data
          comments: { 
            include: { author: { select: { email: true, role: true } } },
            orderBy: { createdAt: "asc" }
          }
        },
        orderBy: { createdAt: "desc" },
        skip,
        take
      }),
      prisma.ticket.count({ where: whereClause })
    ]);

    // 4. Return data wrapped in a pagination meta object
    res.status(200).json({
      data: tickets,
      meta: { total, page: pageNum, totalPages: Math.ceil(total / take) }
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve tickets." });
  }
};
export const updateTicket = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, priority, assignedToId } = req.body;

    const updatedTicket = await prisma.ticket.update({
      where: { id: id as string },
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