import { Router } from "express";
import { verifyToken, verifyTokenAndAuthorization } from "../middlewares/verifyToken.js";
import {
  createTicket,
  deleteTicket,
  getTicket,
  getTickets,
  updateTicket,
} from "../services/tickets.js";

const router = Router();

// Get all tickets
router.get("/", verifyToken, getTickets);

// Create a new ticket
router.post("/", verifyToken, createTicket);

// Get a single ticket
router.get("/:id", verifyToken, getTicket);

// Update a ticket
router.patch("/:id", verifyToken, updateTicket);

// Delete a ticket
router.delete("/:id", verifyTokenAndAuthorization, deleteTicket);

export default router;
