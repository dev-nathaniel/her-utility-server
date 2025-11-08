import crypto from "crypto";
import mongoose from "mongoose";
import Site from "../models/Site.js";
import User from "../models/User.js";
import {sendEmail} from "../utils/sendEmail.js";

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
    const exists = (site.owners || []).some(o => String(o.userId) === String(user._id));
    site.owners = site.owners || [];
    if (!exists) {
      site.owners.push({ userId: user._id as mongoose.Types.ObjectId, role });
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