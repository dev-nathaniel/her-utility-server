import type { Request, Response } from "express";
import User from "../models/User.js";
import mongoose from "mongoose";
import Business from "../models/Business.js";
import { createSite } from "./sites.js";
import Site from "../models/Site.js";
import Utility from "../models/Utility.js";

export const createBusiness = async (request: Request, response: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { name, address, members } = request.body;
    if (!members || !name || !address) {
      return response.status(400).json({ message: "Missing required fields." });
    }
    if (!Array.isArray(members) || members.length === 0) {
      return response.status(400).json({
        message: "members must be a non-empty array of user ids and role",
      });
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
      return response
        .status(400)
        .json({ message: "Invalid user id(s) provided", invalidIds });
    }
    const users = await User.find({ _id: { $in: membersIds } }).select("_id");
    const foundIds = new Set(users.map((user) => String(user._id)));
    const missing = membersIds.filter((id) => !foundIds.has(id));
    if (missing.length) {
      return response
        .status(400)
        .json({ message: "Some users were not found.", missing });
    }
    const businessDoc = await Business.create(
      [
        {
          name,
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
      return response
        .status(500)
        .json({ message: "Failed to create a business" });
    }

    const createdBusiness = businessDoc[0];

    await User.updateMany(
      { _id: { $in: membersIds } },
      { $addToSet: { businesses: createdBusiness._id } },
      { session }
    );

    // create default first site for this business using the business details
    const siteDoc = await createSite(String(createdBusiness._id), {
      name: createdBusiness.name,
      address: createdBusiness.address,
      members: createdBusiness.members,
      session,
    });

    if (!siteDoc) {
      await session.abortTransaction();
      session.endSession();
      console.error("createSite error: created site document missing");
      return response
        .status(500)
        .json({ message: "Failed to create a site" });
    }

    await Business.updateOne(
      { _id: createdBusiness._id },
      { $addToSet: { sites: siteDoc._id } },
      { session }
    );

    await session.commitTransaction();
    session.endSession();
    return response.status(201).json({
      message: "Business created",
      business: businessDoc,
      site: siteDoc,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("createBusiness error:", error);
    return response
      .status(500)
      .json({ message: "Failed to create a business" });
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
    .populate({
      path: "members.userId",
      model: "User",
      select: "_id fullname email",
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
      return response.status(400).json({ message: "token is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return response.status(400).json({ messafe: "Invalid userId" });
    }

    const businesses = await getBusinessesForUserId(userId);
    return response.status(200).json({ businesses });
  } catch (error: any) {
    console.log("fetchBusinessesForUser error:", error);
    return response.status(500).json({ message: "Failed to fetch businesses" });
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
      select: "_id fullname email",
  })
    .populate("invites")
    if (!business) {
      return response.status(404).json({ message: "Business not found" })
    }
    return response.status(200).json({ message: 'successful', business})
  } catch (error) {
    console.log("error fetching business", error)
    return response.status(500).json({ message: "Failed to fetch business by ID"})
  }
}

export async function fetchBusinessMember(request:Request, response: Response) {
  console.log("Get business member endpoint hit")
  try {
    const { id: businessId, userId } = request.params;
    console.log(businessId, userId)
    if (!businessId || !userId) {
      return response.status(400).json({ message: "Business id and user id are required"})
    }

    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(businessId) || !mongoose.Types.ObjectId.isValid(userId)) {
      return response.status(400).json({ message: "Invalid businessId or userId" });
    }

    // 1. Find the business and check membership
    const business = await Business.findById(businessId);
    console.log(business, 'business')
    if (!business) {
      return response.status(404).json({ message: "Business not found" });
    }

    // Check if user is in the business members array
    const memberRecord = business.members.find(
      (m) => m.userId.toString() === userId
    );

    if (!memberRecord) {
      return response.status(403).json({
        message: "User is not a member of this business"
      });
    }

    // 2. Fetch user with only needed fields
    const user = await User.findById(userId)
      .select("fullname email sites") // only return what you need
      .lean();

    if (!user) {
      return response.status(404).json({ message: "User not found" });
    }

    // 3. Attach the role (from business.members)
    const result = {
      fullname: user.fullname,
      email: user.email,
      sites: user.sites ?? [],
      role: memberRecord.role, // owner | manager | viewer
    };

    return response.status(200).json(result);

  } catch (error) {
    console.error("Error fetching business member:", error);
    return response.status(500).json({ message: "Internal server error" });
  }
}

export async function updateMemberRole(request: Request, response: Response) {
  console.log("Update member role endpoint hit")
  try {
    //check param member and business id is a string
    const {id, memberId} = request.params
    if (!id || !memberId) {
      console.log("id and memberId are required")
      return response.status(400).json({ message: "id and memberId are required" })
    }
    //check param member and business id is available
    //check param member and business id is valid mongoose objectId
    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(memberId)) {
      console.log("Invalid id or memberId")
      return response.status(400).json({ message: "Invalid id or memberId" });
    }
    //check business exists
    const business = Business.findById(id)

    if (!business) {
      console.log("Business not found")
      return response.status(404).json({ message: "Business not found" })
    }
    //check member exists in business
    //check role is in body
    //update business
    const {role} = request.body
    if (!role) {
      console.log("Role is required")
      return response.status(400).json({ message: "Role is required" })
    }
    
    return response.status(200).json({message: "Successful"})
  } catch (error) {
    console.log("Error updating member role", error)
    return response.status(500).json({ message: "Failed to update member role"})
  }
}

export async function getAllBusinesses(request: Request, response: Response) {
  console.log("Get all businesses endpoint hit");
  try {
    const businesses = await Business.find().sort({ createdAt: -1 });

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

    response.status(200).json({ message: "Successful", businesses: businessesWithStats });
  } catch (error) {
    console.error("Error fetching all businesses:", error);
    response.status(500).json({ message: "Failed to fetch businesses" });
  }
}