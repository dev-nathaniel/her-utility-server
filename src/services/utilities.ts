import type { Request, Response } from "express";
import mongoose from "mongoose";
import Utility from "../models/Utility.js";
import Business from "../models/Business.js";
import Site from "../models/Site.js";
import { sendSuccess, sendError } from "../utils/response-helper.js";

export async function getUtilities(request: Request, response: Response) {
  console.log("Get utilities endpoint hit");
  try {
    const { search, status } = request.query;
    const query: any = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (search) {
      // Basic search on supplier or identifier
      // Note: Searching populated fields (business name) requires aggregate or post-processing
      // For now, let's search simpler fields first
      query.$or = [
        { supplier: { $regex: search, $options: "i" } },
        { identifier: { $regex: search, $options: "i" } },
        // { 'business.name': { $regex: search, $options: "i" } } // This won't work with simple find()
      ];
    }

    const utilities = await Utility.find(query)
      .populate("site")
      .populate("business")
      .sort({ createdAt: -1 });

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
    const utility = await Utility.findById(id)
      .populate("site")
      .populate({
        path: "business",
        populate: { path: "members.userId", model: "User" }
      });

    if (!utility) {
      return sendError(response, 404, "Utility not found");
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

    // Verify referenced documents exist
    if (businessId) {
      const businessExists = await Business.exists({ _id: businessId });
      if (!businessExists) {
        return sendError(response, 404, "Business not found.");
      }
    }

    if (siteId) {
      const siteExists = await Site.exists({ _id: siteId });
      if (!siteExists) {
        return sendError(response, 404, "Site not found.");
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