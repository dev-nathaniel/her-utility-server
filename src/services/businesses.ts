import type { Request, Response } from "express";
import User from "../models/User.js";
import mongoose from "mongoose";
import Business from "../models/Business.js";
import { createSite } from "./sites.js";
import Site from "../models/Site.js";
import Utility from "../models/Utility.js";
import { sendSuccess, sendError } from "../utils/response-helper.js";
import { parsePaginationParams, buildPaginationMeta } from "../utils/pagination.js";

export const createBusiness = async (request: Request, response: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { name, postcode, address, members } = request.body;
    if (!members || !name || (!address && !postcode)) {
      return sendError(response, 400, "Business name and either address or postcode are required.");
    }
    if (!Array.isArray(members) || members.length === 0) {
      return sendError(response, 400, "members must be a non-empty array of user ids and role");
    }
    //check if there is userId and/or role
    console.log(members, "members");
    const membersIds = Array.from(
      new Set(members.map((member) => String(member.userId).trim()))
    );
    console.log(membersIds, "members ids");
    const invalidIds = membersIds.filter(
      (id) => !mongoose.Types.ObjectId.isValid(id)
    );
    console.log(invalidIds, "invalid Ids");

    if (invalidIds.length) {
      return sendError(response, 400, "Invalid user id(s) provided", { invalidIds });
    }
    const users = await User.find({ _id: { $in: membersIds } }).select("_id");
    const foundIds = new Set(users.map((user) => String(user._id)));
    const missing = membersIds.filter((id) => !foundIds.has(id));
    if (missing.length) {
      return sendError(response, 400, "Some users were not found.", { missing });
    }
    const businessDoc = await Business.create(
      [
        {
          name,
          postcode,
          address,
          members,
        },
      ],
      { session }
    );

    // Ensure the created document exists before accessing index 0
    if (!businessDoc || businessDoc.length === 0 || !businessDoc[0]) {
      await session.abortTransaction();
      session.endSession();
      console.error("createBusiness error: created business document missing");
      return sendError(response, 500, "Failed to create a business");
    }

    const createdBusiness = businessDoc[0];

    await User.updateMany(
      { _id: { $in: membersIds } },
      { $addToSet: { businesses: createdBusiness._id } },
      { session }
    );

    // Auto-site creation disabled — sites are now added separately
    // const siteDoc = await createSite(String(createdBusiness._id), {
    //   name: createdBusiness.name,
    //   address: createdBusiness.address,
    //   members: createdBusiness.members,
    //   session,
    // });

    // if (!siteDoc) {
    //   await session.abortTransaction();
    //   session.endSession();
    //   console.error("createSite error: created site document missing");
    //   return sendError(response, 500, "Failed to create a site");
    // }

    // await Business.updateOne(
    //   { _id: createdBusiness._id },
    //   { $addToSet: { sites: siteDoc._id } },
    //   { session }
    // );

    await session.commitTransaction();
    session.endSession();
    sendSuccess(response, 201, "Business created", {
      business: createdBusiness,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("createBusiness error:", error);
    sendError(response, 500, "Failed to create a business");
  }
};

export async function getBusinessesForUserId(userId: string) {
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error("Invalid userId");
  }

  const businesses = await Business.find({
    "members.userId": new mongoose.Types.ObjectId(userId),
  })
    .populate("invites")
    .populate("utilities")
    .populate({
      path: "members.userId",
      model: "User",
      select: "_id firstName lastName email",
    })
    .lean()
    .exec();

  return businesses;
}

export async function fetchBusinessesForUser(
  request: Request,
  response: Response
) {
  try {
    const userId = String(request.user.userId).trim();
    if (!userId) {
      return sendError(response, 400, "Token is required");
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return sendError(response, 400, "Invalid userId");
    }

    const businesses = await getBusinessesForUserId(userId);
    sendSuccess(response, 200, "Successful", { businesses });
  } catch (error: any) {
    console.log("fetchBusinessesForUser error:", error);
    sendError(response, 500, "Failed to fetch businesses");
  }
}

export async function fetchBusiness(request: Request, response: Response) {
  console.log("Get business by ID endpoint hit");
  try {
    const business = await Business.findById(request.params.id)
    .populate("sites")
    .populate({
      path: "members.userId",
      model: "User",
      select: "_id firstName lastName email",
  })
    .populate("invites")
    if (!business) {
      return sendError(response, 404, "Business not found");
    }
    sendSuccess(response, 200, "Successful", { business });
  } catch (error) {
    console.log("error fetching business", error)
    sendError(response, 500, "Failed to fetch business by ID");
  }
}

export async function fetchBusinessMember(request:Request, response: Response) {
  console.log("Get business member endpoint hit")
  try {
    const { id: businessId, userId } = request.params;
    console.log(businessId, userId)
    if (!businessId || !userId) {
      return sendError(response, 400, "Business id and user id are required");
    }

    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(businessId) || !mongoose.Types.ObjectId.isValid(userId)) {
      return sendError(response, 400, "Invalid businessId or userId");
    }

    // 1. Find the business and check membership
    const business = await Business.findById(businessId);
    console.log(business, 'business')
    if (!business) {
      return sendError(response, 404, "Business not found");
    }

    // Check if user is in the business members array
    const memberRecord = business.members.find(
      (m) => m.userId.toString() === userId
    );

    if (!memberRecord) {
      return sendError(response, 403, "User is not a member of this business");
    }

    // 2. Fetch user with only needed fields
    const user = await User.findById(userId)
      .select("firstName lastName email sites") // only return what you need
      .lean();

    if (!user) {
      return sendError(response, 404, "User not found");
    }

    // 3. Attach the role (from business.members)
    const result = {
      firstName: user.firstName,
      lastName: user.lastName,
      // fullname: `${user.firstName} ${user.lastName}`,
      email: user.email,
      sites: user.sites ?? [],
      role: memberRecord.role, // owner | manager | viewer
    };

    sendSuccess(response, 200, "Successful", result);

  } catch (error) {
    console.error("Error fetching business member:", error);
    sendError(response, 500, "Internal server error");
  }
}

export async function updateMemberRole(request: Request, response: Response) {
  console.log("Update member role endpoint hit")
  try {
    //check param member and business id is a string
    const {id, memberId} = request.params
    if (!id || !memberId) {
      console.log("id and memberId are required")
      return sendError(response, 400, "id and memberId are required");
    }
    //check param member and business id is available
    //check param member and business id is valid mongoose objectId
    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(memberId)) {
      console.log("Invalid id or memberId")
      return sendError(response, 400, "Invalid id or memberId");
    }
    //check business exists
    const business = Business.findById(id)

    if (!business) {
      console.log("Business not found")
      return sendError(response, 404, "Business not found");
    }
    //check member exists in business
    //check role is in body
    //update business
    const {role} = request.body
    if (!role) {
      console.log("Role is required")
      return sendError(response, 400, "Role is required");
    }
    
    sendSuccess(response, 200, "Successful");
  } catch (error) {
    console.log("Error updating member role", error)
    sendError(response, 500, "Failed to update member role");
  }
}

export async function getAllBusinesses(request: Request, response: Response) {
  console.log("Get all businesses endpoint hit");
  try {
    const { page, pageSize, skip } = parsePaginationParams(request);
    const totalItems = await Business.countDocuments();

    const businesses = await Business.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize);

    const businessesWithStats = await Promise.all(businesses.map(async (business) => {
        const siteCount = await Site.countDocuments({ business: business._id });
        const sites = await Site.find({ business: business._id }).select('_id');
        const siteIds = sites.map(s => s._id);
        const contractCount = await Utility.countDocuments({ site: { $in: siteIds } });

        return {
            ...business.toObject(),
            numberOfSites: siteCount,
            numberOfContracts: contractCount
        };
    }));

    const pagination = buildPaginationMeta(totalItems, page, pageSize);

    sendSuccess(response, 200, "Successful", { businesses: businessesWithStats, pagination });
  } catch (error) {
    console.error("Error fetching all businesses:", error);
    sendError(response, 500, "Failed to fetch businesses");
  }
}