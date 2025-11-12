import crypto from "crypto";
import mongoose from "mongoose";
import Site from "../models/Site.js";
import User from "../models/User.js";
import {sendEmail} from "../utils/sendEmail.js";
import type { Request, Response } from "express";

/*
Behavior:
- If a user with email exists: add to site.owners with role (if not already).
- If not exists: add an invitation record to site.metadata.invitations with token.
- Send email notification in both cases (if sendEmail util exists).
*/

export async function inviteToSite(siteId: string, email: string, role: "owner" | "manager" | "viewer", invitedBy?: string) {
  const site = await Site.findById(siteId);
  if (!site) throw new Error("Site not found");

  const user = await User.findOne({ email: email.toLowerCase().trim() });

  if (user) {
    // Add to owners if not present
    const exists = (site.members || []).some(o => String(o.userId) === String(user._id));
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
        html: `${invitedBy ? `Invited by ${invitedBy}. ` : ""}You were granted "${role}" access to site "${site.name}".`,
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
        from: 'adebayoolowofoyeku@gmail.com',
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
  const sites = await Site.find({ "members.userId": new mongoose.Types.ObjectId(userId) })
    .populate("business")
    .populate({
      path: "members.userId",
      model: "User",
      select: "_id fullname email"
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