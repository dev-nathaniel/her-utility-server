import type { Request, Response } from "express";
import User from "../models/User.js";

export const getDashboardOverview = async (request:Request, response: Response) => {
    console.log("Get dashboard overview endpoint hit")
    try {
        const userCount = await User.countDocuments();
        response.status(200).json({ message: "Dashboard overview retrieved successfully", overview: {userCount} });
    } catch (error) {
        console.error("Error fetching dashboard overview:", error)
        response.status(500).json({ message: "Failed to get dashboard overview"})
    }
}