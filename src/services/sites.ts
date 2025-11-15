import crypto from "crypto";
import mongoose from "mongoose";
import Site from "../models/Site.js";
import User from "../models/User.js";
import { sendEmail } from "../utils/sendEmail.js";
import type { Request, Response } from "express";
import Business from "../models/Business.js";

/*
Behavior:
- If a user with email exists: add to site.owners with role (if not already).
- If not exists: add an invitation record to site.metadata.invitations with token.
- Send email notification in both cases (if sendEmail util exists).
*/

export async function inviteToSite(
  siteId: string,
  email: string,
  role: "owner" | "manager" | "viewer",
  invitedBy?: string
) {
  const site = await Site.findById(siteId);
  if (!site) throw new Error("Site not found");

  const user = await User.findOne({ email: email.toLowerCase().trim() });

  if (user) {
    // Add to owners if not present
    const exists = (site.members || []).some(
      (o) => String(o.userId) === String(user._id)
    );
    site.members = site.members || [];
    if (!exists) {
      site.members.push({ userId: user._id as mongoose.Types.ObjectId, role });
      await site.save();
    }

    // send notification
    try {
      await sendEmail({
        from: "adebayoolowofoyeku@gmail.com",
        to: user.email,
        subject: `You've been added to site: ${site.name}`,
        html: `${
          invitedBy ? `Invited by ${invitedBy}. ` : ""
        }You were granted "${role}" access to site "${site.name}".`,
      });
    } catch (e) {
      console.warn("Email failed", e);
    }

    return { invited: true, existingUser: true, userId: user._id };
  } else {
    // create pending invite in site.metadata.invitations
    const token = crypto.randomBytes(20).toString("hex");
    site.metadata = site.metadata || {};
    site.metadata.invitations = site.metadata.invitations || [];
    site.metadata.invitations.push({
      email,
      role,
      invitedBy: invitedBy || null,
      token,
      createdAt: new Date(),
      accepted: false,
    });
    await site.save();

    // send invite email with token link (frontend should handle token)
    try {
      await sendEmail({
        from: "adebayoolowofoyeku@gmail.com",
        to: email,
        subject: `Invite to join site: ${site.name}`,
        html: `You've been invited to manage site "${site.name}" as "${role}". Use this token to register / accept: ${token}`,
      });
    } catch (e) {
      console.warn("Email failed", e);
    }

    return { invited: true, existingUser: false, token };
  }
}

/**
 * Return sites where the given userId is a member.
 * Throws if userId is invalid.
 */
export async function getSitesForUserId(userId: string) {
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error("Invalid userId");
  }

  // find sites where members array contains this userId
  const sites = await Site.find({
    "members.userId": new mongoose.Types.ObjectId(userId),
  })
    .populate("business")
    .populate({
      path: "members.userId",
      model: "User",
      select: "_id fullname email",
    })
    .lean()
    .exec();

  return sites;
}

/**
 * Express handler: accepts userId in params, query or body.
 * e.g. GET /sites/user/:userId or GET /sites?userId=...
 */
export async function fetchSitesForUser(request: Request, response: Response) {
  try {
    const userId = String(request.user.userId).trim();
    if (!userId) {
      return response.status(400).json({ message: "userId is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return response.status(400).json({ message: "Invalid userId" });
    }

    const sites = await getSitesForUserId(userId);
    return response.status(200).json({ sites });
  } catch (err: any) {
    console.error("fetchSitesForUser error:", err);
    return response.status(500).json({ message: "Failed to fetch sites" });
  }
}

/**
 * Return full site details by siteId.
 * Populates business, members.userId (basic user info) and utilities.
 * Throws on invalid id.
 */
export async function getSiteDetails(siteId: string) {
  if (!siteId || !mongoose.Types.ObjectId.isValid(siteId)) {
    throw new Error("Invalid siteId");
  }

  const site = await Site.findById(siteId)
    .populate("business")
    .populate({
      path: "members.userId",
      model: "User",
      select: "_id fullname email",
    })
    .populate("utilities")
    .lean()
    .exec();

  if (!site) {
    return null;
  }

  return site;
}

/**
 * Express handler to fetch site details.
 * Accepts siteId in params (/sites/:siteId), query (?siteId=) or body.
 */
export async function fetchSiteDetails(request: Request, response: Response) {
  try {
    const siteId = String(request.params.id).trim();

    if (!siteId) {
      return response.status(400).json({ message: "siteId is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(siteId)) {
      return response.status(400).json({ message: "Invalid siteId" });
    }

    const site = await getSiteDetails(siteId);
    if (!site) {
      return response.status(404).json({ message: "Site not found" });
    }

    return response.status(200).json({ site });
  } catch (err: any) {
    console.error("fetchSiteDetails error:", err);
    return response
      .status(500)
      .json({ message: "Failed to fetch site details" });
  }
}

/**
 * Create a site for a given businessId.
 * Options default the site's name/address/members to provided values (used when creating the first site for a new business).
 */
export async function createSite(
  businessId: string,
  options: {
    name?: string;
    address?: string;
    members?: Array<any>;
    metadata?: any;
    session?: any;
  } = {}
) {
  const { name, address, members, metadata, session } = options;
  if (!businessId || !mongoose.Types.ObjectId.isValid(businessId)) {
    throw new Error("Invalid businessId");
  }

  const siteDoc = await Site.create(
    [
      {
        business: new mongoose.Types.ObjectId(businessId),
        name: options.name ?? undefined,
        address: options.address ?? undefined,
        members: options.members ?? [],
        metadata: options.metadata ?? {},
      },
    ],
    { session }
  );

  return siteDoc[0];
}

export async function AddSite(request: Request, response: Response) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { businessId, name, address, members, metadata } = request.body;

    if (!businessId || !mongoose.Types.ObjectId.isValid(String(businessId))) {
      await session.abortTransaction();
      session.endSession();
      console.log("Valid businessId is required")
      return response
        .status(400)
        .json({ message: "Valid businessId is required" });
    }

    if (!name || !address) {
      await session.abortTransaction();
      session.endSession();
      console.log("Name and Adress are required")
      return response
        .status(400)
        .json({ message: "Name and Adress are required" });
    }

    let memberIds: string[] = []

    // we can just add the user in the request from token as member
    // we can also have an option in the frontend for users to add members
    if (members !== undefined) {
      if (!Array.isArray(members)) {
        await session.abortTransaction();
        session.endSession();
        console.log("members must be an array")
        return response
          .status(400)
          .json({ message: "members must be an array" });
      }

      memberIds = Array.from(
        new Set(members.map((member) => String(member.userId ?? "").trim()))
      );
      const invalidIds = memberIds.filter(
        (id: string) => !mongoose.Types.ObjectId.isValid(id)
      );
      if (invalidIds.length) {
        await session.abortTransaction();
        session.endSession();
        console.log("Invalid user id(s) provided")
        return response
          .status(400)
          .json({ message: "Invalid user id(s) provided", invalidIds });
      }

      const users = await User.find({ _id: { $in: memberIds } }).select("_id");
      const foundIds = new Set(users.map((u) => String(u._id)));
      const missing = memberIds.filter((id: string) => !foundIds.has(id));
      if (missing.length) {
        await session.abortTransaction();
        session.endSession();
        console.log("Some users were not found.")
        return response
          .status(400)
          .json({ message: "Some users were not found.", missing });
      }
    }

    const site = await createSite(String(businessId), {
      name,
      address,
      members,
      metadata,
    });

    if (!site) {
      console.log("Site creation failed")
      return response.status(400).json({ message: "Site creation failed"})
    }

    await Business.findByIdAndUpdate(businessId, {
      $addToSet: { sites: site._id },
    });

    await User.updateMany(
      { _id: { $in: memberIds } },
      { $addToSet: { sites: site._id } },
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    return response.status(201).json({ message: "Site created", site });
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();
    console.error("AddSite error:", error);
    return response.status(500).json({ message: "Failed to create site" });
  }
}
