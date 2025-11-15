import type { Request, Response } from "express";
import Invite from "../models/Invite.js";
import mongoose from "mongoose";

export async function getInvites(request: Request, response: Response) {
  console.log("Get users endpoint hit");
  try {
    const users = await Invite.find({}, { password: 0 }).sort({
      createdAt: -1,
    });
    response.status(200).send({ message: "Successful", users });
  } catch (error) {
    response.status(400).send({ message: "Error fetching users" });
  }
}

export async function createInvite(request: Request, response: Response) {
  console.log("Create invite endpoint hit");
  try {
    const { email, role, businessId, siteId } = request.body;

    if (!email || !role || !businessId || siteId) {
      console.log("Email or role or businessId is required");
      return response
        .status(400)
        .json({ message: "Email or role or businessId is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(String(businessId))) {
      console.log("Valid businessId is required");
      return response
        .status(400)
        .json({ message: "Valid businessId is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(String(siteId))) {
      console.log("Valid siteId is required");
      return response
        .status(400)
        .json({ message: "Valid siteId is required" });
    }

    //create business -> invite user -> add user to sites
    //create site with invited users 
    //create site -> invite user with sites
    //create site -> invite user -> add user to site
  } catch (error) {
    console.log("create invite error", error);
    return response.status(500).json({ message: "Failed to create invite" });
  }
}

// /**
//  * Invite staff to a business by email.
//  */
// export const inviteStaff = async (req, res, next) => {
//   try {

//     const inviterMembership = await BusinessMembership.findOne({
//       business_id: businessId,
//       user_id: req.user._id,
//     });

//     if (
//       !inviterMembership ||
//       !["owner", "manager"].includes(inviterMembership.role)
//     ) {
//       return res.status(403).json({
//         message: "You do not have permission to invite staff.",
//       });
//     }

//     const user = await User.findOne({ email });
//     if (!user)
//       return res.status(404).json({ message: "User with this email not found." });

//     const existing = await BusinessMembership.findOne({
//       business_id: businessId,
//       user_id: user._id,
//     });
//     if (existing)
//       return res
//         .status(400)
//         .json({ message: "User is already a member of this business." });

//     const membership = await BusinessMembership.create({
//       business_id: businessId,
//       user_id: user._id,
//       role,
//       invitation_status: "pending",
//     });

//     // TODO: send invitation email
//     res.status(201).json({
//       message: "Invitation sent successfully.",
//       membership,
//     });
//   } catch (err) {
//     next(err);
//   }
// };
