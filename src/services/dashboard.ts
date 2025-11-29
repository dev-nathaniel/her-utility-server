import type { Request, Response } from "express";
import User from "../models/User.js";
import Business from "../models/Business.js";
import Site from "../models/Site.js";
import Quote from "../models/Quote.js";
import Utility from "../models/Utility.js";
import Email from "../models/Email.js";
import Template from "../models/Template.js";

export const getDashboardOverview = async (request:Request, response: Response) => {
    console.log("Get dashboard overview endpoint hit")
    try {
        const userCount = await User.countDocuments();
        const businessCount = await Business.countDocuments();
        const siteCount = await Site.countDocuments();
        const pendingQuotesCount = await Quote.countDocuments({ status: 'pending' });
        const contractsCount = await Utility.countDocuments();
        const emailsSentCount = await Email.countDocuments({ status: 'sent' });
        const templatesCount = await Template.countDocuments();

        response.status(200).json({ 
            message: "Dashboard overview retrieved successfully", 
            overview: {
                userCount, 
                businessCount, 
                siteCount,
                pendingQuotesCount,
                contractsCount,
                emailsSentCount,
                templatesCount
            } 
        });
    } catch (error) {
        console.error("Error fetching dashboard overview:", error)
        response.status(500).json({ message: "Failed to get dashboard overview"})
    }
}