import type { Request, Response } from "express";
import Ticket, { type ITicket } from "../models/Ticket.js";
import { sendSuccess, sendError } from "../utils/response-helper.js";

// Get all tickets with filtering and pagination
export const getTickets = async (req: Request, res: Response) => {
    try {
        const { status, priority, search } = req.query;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;

        let query: any = {};

        if (status && status !== 'all') query.status = status;
        if (priority && priority !== 'all') query.priority = priority;

        if (search) {
            query.$or = [
                { subject: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { customer: { $regex: search, $options: 'i' } }
            ];
        }

        const tickets = await Ticket.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Ticket.countDocuments(query);

        sendSuccess(res, 200, "Tickets retrieved successfully", {
            tickets,
            pagination: {
                total,
                page,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("Error fetching tickets:", error);
        sendError(res, 500, "Failed to fetch tickets");
    }
};

// Create a new ticket
export const createTicket = async (req: Request, res: Response) => {
    try {
        const { customer, customerEmail, subject, category, priority, description, message } = req.body;

        // Create initial message
        const initialMessage = {
            from: "customer",
            author: customer,
            content: message || description, // Use message if provided, fallback to description
            timestamp: new Date()
        };

        const newTicket = new Ticket({
            customer,
            customerEmail,
            subject,
            category,
            priority,
            messages: [initialMessage]
        });

        await newTicket.save();
        sendSuccess(res, 201, "Ticket created successfully", { ticket: newTicket });
    } catch (error) {
        console.error("Error creating ticket:", error);
        sendError(res, 500, "Failed to create ticket");
    }
};

// Get a single ticket by ID
export const getTicket = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const ticket = await Ticket.findById(id);

        if (!ticket) {
            return sendError(res, 404, "Ticket not found");
        }

        sendSuccess(res, 200, "Ticket retrieved successfully", { ticket });
    } catch (error) {
        console.error("Error fetching ticket:", error);
        sendError(res, 500, "Failed to fetch ticket");
    }
};

// Update a ticket (status, priority, add message)
export const updateTicket = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status, priority, assignee, newMessage } = req.body;

        const ticket = await Ticket.findById(id);

        if (!ticket) {
            return sendError(res, 404, "Ticket not found");
        }

        if (status) ticket.status = status;
        if (priority) ticket.priority = priority;
        if (assignee) ticket.assignee = assignee;

        if (newMessage) {
            ticket.messages.push({
                from: newMessage.from || "agent",
                author: newMessage.author || "Support Agent",
                content: newMessage.content,
                timestamp: new Date()
            });
            // Update the main updated field
            // Mongoose handles updatedAt automatically but this ensures explicit update logic if needed
        }

        await ticket.save();
        sendSuccess(res, 200, "Ticket updated successfully", { ticket });
    } catch (error) {
        console.error("Error updating ticket:", error);
        sendError(res, 500, "Failed to update ticket");
    }
};

// Delete a ticket
export const deleteTicket = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const deletedTicket = await Ticket.findByIdAndDelete(id);

        if (!deletedTicket) {
            return sendError(res, 404, "Ticket not found");
        }

        sendSuccess(res, 200, "Ticket deleted successfully");
    } catch (error) {
        console.error("Error deleting ticket:", error);
        sendError(res, 500, "Failed to delete ticket");
    }
};
