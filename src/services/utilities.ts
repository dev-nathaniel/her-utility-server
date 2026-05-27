import type { Request, Response } from "express";
import mongoose from "mongoose";
import Utility from "../models/Utility.js";
import Business from "../models/Business.js";
import Site from "../models/Site.js";
import { sendSuccess, sendError } from "../utils/response-helper.js";

export async function getUtilities(request: Request, response: Response) {
  console.log("Get utilities endpoint hit");
  try {
    const { search, status, sortBy, order } = request.query;
    const userId = request.user?.userId;
    const userRole = request.user?.role;
    
    const conditions: any[] = [];

    // Filter by user's businesses and sites if not admin
    if (userRole !== 'admin' && userId) {
      const userBusinesses = await Business.find({ "members.userId": userId }).select("_id");
      const businessIds = userBusinesses.map(b => b._id);
      
      const userSites = await Site.find({ business: { $in: businessIds } }).select("_id");
      const siteIds = userSites.map(s => s._id);

      conditions.push({
        $or: [
          { business: { $in: businessIds } },
          { site: { $in: siteIds } }
        ]
      });
    }

    if (status && status !== 'all') {
      conditions.push({ status });
    }

    if (search) {
      conditions.push({
        $or: [
          { supplier: { $regex: search, $options: "i" } },
          { identifier: { $regex: search, $options: "i" } }
        ]
      });
    }

    const query = conditions.length > 0 ? { $and: conditions } : {};

    let sortObj: any = { createdAt: -1 };

    let utilities = await Utility.find(query)
      .populate("site")
      .populate("business")
      .sort(sortObj);

    if (sortBy === 'expiry') {
      utilities.sort((a, b) => {
        if (!a.contractEnd && !b.contractEnd) return 0;
        if (!a.contractEnd) return 1; // push nulls to the end
        if (!b.contractEnd) return -1;
        const timeA = new Date(a.contractEnd).getTime();
        const timeB = new Date(b.contractEnd).getTime();
        return order === 'desc' ? timeB - timeA : timeA - timeB;
      });
    }

    // Optional: Filter by business name in memory if search is present
    // This is not efficient for large datasets but works for now
    let finalUtilities = utilities;
    if (search) {
      const searchLower = (search as string).toLowerCase();
      finalUtilities = utilities.filter(u => {
        const busName = (u.business as any)?.name?.toLowerCase() || "";
        const supplier = u.supplier?.toLowerCase() || "";
        const identifier = u.identifier?.toLowerCase() || "";
        return busName.includes(searchLower) || supplier.includes(searchLower) || identifier.includes(searchLower);
      });
    }

    // Use sendSuccess for consistent response shape: { success: true, message: "...", data: { utilities: ... } }
    sendSuccess(response, 200, "Successful", { utilities: finalUtilities });
  } catch (error) {
    console.error("Error fetching utilities:", error);
    sendError(response, 400, "Error fetching utilities");
  }
}


export async function getUtility(request: Request, response: Response) {
  try {
    const { id } = request.params;
    const userId = request.user?.userId;
    const userRole = request.user?.role;

    const utility = await Utility.findById(id)
      .populate("site")
      .populate({
        path: "business",
        populate: { path: "members.userId", model: "User" }
      });

    if (!utility) {
      return sendError(response, 404, "Utility not found");
    }

    // Verify requesting user is member of the associated business or site's business
    if (userRole !== 'admin' && userId) {
      const business = utility.business as any;
      const site = utility.site as any;
      let hasAccess = false;

      if (business && business.members) {
        hasAccess = business.members.some((m: any) => String(m.userId?._id || m.userId) === String(userId));
      }

      if (!hasAccess && site && site.business) {
        const siteBusiness = await Business.findById(site.business);
        if (siteBusiness && siteBusiness.members) {
          hasAccess = siteBusiness.members.some((m: any) => String(m.userId) === String(userId));
        }
      }

      if (!hasAccess) {
        return sendError(response, 403, "You are not authorized to view this utility");
      }
    }

    sendSuccess(response, 200, "Utility found", utility);
  } catch (error) {
    console.error("getUtility error:", error);
    sendError(response, 500, "Error fetching utility");
  }
}
/**
 * Create a new utility.
 * Body: { businessId?, siteId?, type, supplier?, identifier?, contractStart?, contractEnd?, status? }
 * At least one of businessId or siteId must be provided.
 */
export async function createUtility(request: Request, response: Response) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      businessId,
      siteId,
      type,
      supplier,
      identifier,
      contractStart,
      contractEnd,
      billingFrequency,
      paymentMethod,
      notes,
      email,
      postcode,
      status,
      previousContractExpiry,
      previousMeterId,
      previousSupplier,
    } = request.body;

    // --- validation ---
    if (!businessId && !siteId) {
      return sendError(response, 400, "At least one of businessId or siteId is required.");
    }

    if (!type) {
      return sendError(response, 400, "Utility type is required.");
    }

    if (businessId && !mongoose.Types.ObjectId.isValid(businessId)) {
      return sendError(response, 400, "Invalid businessId.");
    }

    if (siteId && !mongoose.Types.ObjectId.isValid(siteId)) {
      return sendError(response, 400, "Invalid siteId.");
    }

    // Verify referenced documents exist and verify authorization
    const userId = request.user?.userId;
    const userRole = request.user?.role;

    if (businessId) {
      const business = await Business.findById(businessId);
      if (!business) {
        return sendError(response, 404, "Business not found.");
      }
      if (userRole !== 'admin' && userId) {
        const isMember = business.members.some(m => String(m.userId) === String(userId));
        if (!isMember) {
          return sendError(response, 403, "You are not authorized to add a utility to this business.");
        }
      }
    }

    if (siteId) {
      const site = await Site.findById(siteId);
      if (!site) {
        return sendError(response, 404, "Site not found.");
      }
      if (userRole !== 'admin' && userId) {
        const siteBusiness = await Business.findById(site.business);
        const isMember = siteBusiness?.members.some(m => String(m.userId) === String(userId));
        if (!isMember) {
          return sendError(response, 403, "You are not authorized to add a utility to this site.");
        }
      }
    }
    console.log("status", status);
    // --- create ---
    const utilityDoc = await Utility.create(
      [
        {
          ...(siteId && { site: siteId }),
          ...(businessId && { business: businessId }),
          type,
          supplier,
          identifier,
          contractStart,
          contractEnd,
          billingFrequency,
          paymentMethod,
          notes,
          email,
          postcode,
          status: status || "pending",
          previousContractExpiry,
          previousMeterId,
          previousSupplier,
        },
      ],
      { session }
    );

    if (!utilityDoc || utilityDoc.length === 0 || !utilityDoc[0]) {
      await session.abortTransaction();
      session.endSession();
      return sendError(response, 500, "Failed to create utility.");
    }

    const createdUtility = utilityDoc[0];

    // Push the utility ref into the associated Business and/or Site
    if (businessId) {
      await Business.updateOne(
        { _id: businessId },
        { $addToSet: { utilities: createdUtility._id } },
        { session }
      );
    }

    if (siteId) {
      await Site.updateOne(
        { _id: siteId },
        { $addToSet: { utilities: createdUtility._id } },
        { session }
      );
    }

    await session.commitTransaction();
    session.endSession();

    sendSuccess(response, 201, "Utility created", { utility: createdUtility });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("createUtility error:", error);
    sendError(response, 500, "Failed to create utility.");
  }
}