import type { Request, Response } from "express";
import User from "../models/User.js";
import { sendSuccess, sendError } from "../utils/response-helper.js";
import bcrypt from "bcrypt";

// Get all admins (potentially filtered by status if provided)
export const getAdmins = async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    const query: any = { role: "admin" };
    if (status) {
      query.status = status;
    }

    const admins = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 });

    sendSuccess(res, 200, "Admins retrieved successfully", { admins });
  } catch (error) {
    console.error("Error fetching admins:", error);
    sendError(res, 500, "Failed to retrieve admins");
  }
};

// Get pending admins
export const getPendingAdmins = async (req: Request, res: Response) => {
  try {
    const admins = await User.find({ role: "admin", status: "Pending" })
      .select("-password")
      .sort({ createdAt: -1 });

    sendSuccess(res, 200, "Pending admins retrieved successfully", { admins });
  } catch (error) {
    console.error("Error fetching pending admins:", error);
    sendError(res, 500, "Failed to retrieve pending admins");
  }
};

// Create a new admin
export const createAdmin = async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName, phoneNumber } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return sendError(res, 400, "User with this email already exists");
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newAdmin = await User.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      phoneNumber,
      role: "admin",
      status: "pending", // Or "Pending" if approval needed
    });

    const adminResponse = newAdmin.toObject();
    delete (adminResponse as any).password;

    sendSuccess(res, 201, "Admin created successfully", { admin: adminResponse });
  } catch (error) {
    console.error("Error creating admin:", error);
    sendError(res, 500, "Failed to create admin");
  }
};

// Approve an admin
export const approveAdmin = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const admin = await User.findOneAndUpdate(
      { _id: id, role: "admin" },
      { status: "active" },
      { new: true }
    ).select("-password");

    if (!admin) {
      return sendError(res, 404, "Admin not found");
    }

    sendSuccess(res, 200, "Admin approved successfully", { admin });
  } catch (error) {
    console.error("Error approving admin:", error);
    sendError(res, 500, "Failed to approve admin");
  }
};

// Reject an admin (delete or mark inactive)
export const rejectAdmin = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // Option 1: Delete
    // const admin = await User.findOneAndDelete({ _id: id, role: "admin" });

    // Option 2: Mark as Rejected/Inactive
    const admin = await User.findOneAndUpdate(
      { _id: id, role: "admin" },
      { status: "inactive" },
      { new: true }
    ).select("-password");


    if (!admin) {
      return sendError(res, 404, "Admin not found");
    }

    sendSuccess(res, 200, "Admin rejected successfully", { admin });
  } catch (error) {
    console.error("Error rejecting admin:", error);
    sendError(res, 500, "Failed to reject admin");
  }
};
