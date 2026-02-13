import { Router } from "express";
import { verifyToken, verifyTokenAndAuthorization } from "../middlewares/verifyToken.js";
import {
  approveAdmin,
  createAdmin,
  getAdmins,
  getPendingAdmins,
  rejectAdmin,
} from "../services/admins.js";

const router = Router();

// Get all admins
router.get("/", verifyToken, getAdmins);

// Get pending admins
router.get("/pending", verifyToken, getPendingAdmins);

// Create a new admin
router.post("/", verifyTokenAndAuthorization, createAdmin);

// Approve admin
router.post("/:id/approve", verifyTokenAndAuthorization, approveAdmin);

// Reject admin
router.post("/:id/reject", verifyTokenAndAuthorization, rejectAdmin);

export default router;
