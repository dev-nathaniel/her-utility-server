import type { Request, Response } from "express";
import User from "../models/User.js";
import Business from "../models/Business.js";
import Site from "../models/Site.js";
import Quote from "../models/Quote.js";
import Utility from "../models/Utility.js";
import Email from "../models/Email.js";
import Template from "../models/Template.js";
import Ticket from "../models/Ticket.js";

export const getDashboardOverview = async (request:Request, response: Response) => {
    console.log("Get dashboard overview endpoint hit")
    try {
        const userCount = await User.countDocuments();
        const businessCount = await Business.countDocuments();
        const siteCount = await Site.countDocuments();
        const pendingQuotesCount = await Quote.countDocuments({ status: 'pending' });
        const contractsCount = await Utility.countDocuments();
        const pendingUtilitiesCount = await Utility.countDocuments({ status: 'pending' });
        const emailsSentCount = await Email.countDocuments({ status: 'sent' });
        const templatesCount = await Template.countDocuments();
        const pendingAdminsCount = await User.countDocuments({ status: 'pending', role: 'admin' });

        // Granular Ticket Stats
        const openTicketsCount = await Ticket.countDocuments({ status: 'Open' });
        const inProgressTicketsCount = await Ticket.countDocuments({ status: 'In Progress' });
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const resolvedTicketsCount = await Ticket.countDocuments({ 
            status: 'Resolved', 
            updatedAt: { $gte: startOfToday } 
        });

        // Granular Utility Stats
        const activeUtilitiesCount = await Utility.countDocuments({ status: 'active' });
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        const expiringUtilitiesCount = await Utility.countDocuments({ 
            status: 'active', 
            contractEnd: { $lte: thirtyDaysFromNow, $gte: new Date() } 
        });

        // Granular Quote Stats
        // Schema supports: pending, accepted, rejected, expired
        const acceptedQuotesCount = await Quote.countDocuments({ status: 'accepted' });
        const rejectedQuotesCount = await Quote.countDocuments({ status: 'rejected' });
        // We'll map "in-progress" conceptually to pending for now, or just return pending
        const quotedQuotesCount = 0; // Not currently in schema


        const recentBusinesses = await Business.find().sort({ createdAt: -1 }).limit(5);
        const recentQuotes = await Quote.find().sort({ createdAt: -1 }).limit(5).populate('business');
        const recentTickets = await Ticket.find().sort({ createdAt: -1 }).limit(5);

        response.status(200).json({ 
            message: "Dashboard overview retrieved successfully", 
            overview: {
                userCount, 
                businessCount, 
                siteCount,
                pendingQuotesCount,
                contractsCount,
                pendingUtilitiesCount,
                emailsSentCount,
                templatesCount,
                pendingAdminsCount,
                // Ticket Stats
                openTicketsCount,
                inProgressTicketsCount,
                resolvedTicketsCount,
                // Utility Stats
                activeUtilitiesCount,
                expiringUtilitiesCount, // pendingUtilitiesCount already exists above
                // Quote Stats
                acceptedQuotesCount,
                rejectedQuotesCount,
                
                recentBusinesses,
                recentQuotes,
                recentTickets
            } 
        });
    } catch (error) {
        console.error("Error fetching dashboard overview:", error)
        response.status(500).json({ message: "Failed to get dashboard overview"})
    }
}