import type { Request, Response } from "express";
import mongoose from "mongoose";
import Utility from "../models/Utility.js";
import Business from "../models/Business.js";
import Site from "../models/Site.js";
import { sendSuccess, sendError } from "../utils/response-helper.js";

export async function getUtilities(request: Request, response: Response) {
  console.log("Get utilities endpoint hit");
  try {
    const utilities = await Utility.find()
      .populate("site")
      .populate("business")
      .sort({ createdAt: -1 });
    response.status(200).send({ message: "Successful", utilities });
  } catch (error) {
    response.status(400).send({ message: "Error fetching utilities" });
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