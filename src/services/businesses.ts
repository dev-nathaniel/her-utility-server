import type { Request, Response } from "express";
import User from "../models/User.js";
import mongoose from "mongoose";
import Business from "../models/Business.js";
import { createSite } from "./sites.js";

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
    if (!business) {
      return response.status(404).json({ message: "Business not found" })
    }
    return response.status(200).json({ message: 'successful', business})
  } catch (error) {
    console.log("error fetching business", error)
    return response.status(500).json({ message: "Failed to fetch business by ID"})
  }
}
