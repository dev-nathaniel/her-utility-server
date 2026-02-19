import type { Request, Response } from "express";
import User from "../models/User.js";
import Business from "../models/Business.js";
import Site from "../models/Site.js";
import Utility from "../models/Utility.js";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { sendSuccess, sendError } from "../utils/response-helper.js";
import { parsePaginationParams, buildPaginationMeta } from "../utils/pagination.js";

export async function getUsers(request: Request, response: Response) {
  console.log("Get users endpoint hit");
  try {
    const { page, pageSize, skip } = parsePaginationParams(request);
    const totalItems = await User.countDocuments();

    const users = await User.find({}, { password: 0 })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize);
    
    const usersWithStats = await Promise.all(users.map(async (user) => {
        const businessCount = await Business.countDocuments({ "members.userId": user._id });
        const sites = await Site.find({ "members.userId": user._id }).select('_id');
        const siteCount = sites.length;
        const siteIds = sites.map(s => s._id);
        const contractCount = await Utility.countDocuments({ site: { $in: siteIds } });

        return {
            ...user.toObject(),
            numberOfBusinesses: businessCount,
            numberOfSites: siteCount,
            numberOfContracts: contractCount
        };
    }));

    const pagination = buildPaginationMeta(totalItems, page, pageSize);

    sendSuccess(response, 200, "Successful", { users: usersWithStats, pagination });
  } catch (error) {
    console.error("Error fetching users:", error);
    sendError(response, 400, "Error fetching users");
  }
}

// export async function getUserProfilePicture(
//   request: Request,
//   response: Response
// ) {
//   try {
//     if (!mongoose.connection.db) {
//       response
//         .status(500)
//         .send({ message: "Database connection is not established" });
//       return;
//     }
//     const user = await User.findById(request.params.id);
//     if (!user) {
//       response.status(404).send({ message: "User not found" });
//       return;
//     }
//     if (!user.profilePicture) {
//       response.status(404).send({ message: "Profile picture not found" });
//       return;
//     }

//     const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
//       bucketName: "profilePictures",
//     });
//     const files = await bucket.find({ _id: user.profilePicture }).toArray();
//     if (!files || files.length === 0) {
//       response
//         .status(404)
//         .send({ message: "Profile picture not found in storage" });
//       return;
//     }
//     const readStream = bucket.openDownloadStream(
//       new BSONObjectId(user.profilePicture.toString())
//     );
//     // response.set('Content-Type', files[0].contentType);
//     readStream.pipe(response);
//   } catch (error) {
//     response.status(400).send({ message: "Invalid user ID" });
//   }
// }

export async function getUserById(request: Request, response: Response) {
  console.log("Get user by ID endpoint hit");
  try {
    const user = await User.findById(request.params.id, { password: 0 }); // Exclude password from the response
    if (!user) {
      return sendError(response, 404, "User not found");
    }

    const businesses = await Business.find({ "members.userId": user._id });
    const sites = await Site.find({ "members.userId": user._id });
    const siteIds = sites.map(s => s._id);
    const contracts = await Utility.find({ site: { $in: siteIds } }).populate('site');

    sendSuccess(response, 200, "Successful", {
      user,
      businesses,
      sites,
      contracts
    });
  } catch (error) {
    console.error("Error getting user:", error);
    sendError(response, 400, "Failed to get user");
  }
}

export async function updateUser(request: Request, response: Response) {
  console.log("Update user endpoint hit");
  try {
    const user = (await User.findById(
      request.params.id
    )) as typeof User.prototype & { _id: any };
    if (!user) {
      return sendError(response, 404, "User not found");
    }
    let updatedData = request.body;

    if (updatedData.password) {
      return sendError(response, 400, "Cannot update password");
    }

    if (request.body.expoPushToken) {
      if (user.expoPushTokens) {
        if (!user.expoPushTokens.includes(request.body.expoPushToken)) {
          updatedData.expoPushTokens = [...user.expoPushTokens, request.body.expoPushToken];
        }
      } else {
        updatedData.expoPushTokens = [request.body.expoPushToken];
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      request.params.id,
      updatedData,
      {
        new: true,
        select: "-password", // Exclude password from the response
      }
    );
    if (!updatedUser) {
      return sendError(response, 404, "User not found");
    }
    sendSuccess(response, 200, "User successfully updated", { user: updatedUser });
  } catch (error) {
    sendError(response, 400, "Failed to update user");
  }
}

export async function changePassword(request: Request, response: Response) {
  console.log("Change password endpoint hit")
  try {
    const user = await User.findById(request.params.id);
    if (!user) {
      return sendError(response, 404, "User not found");
    }
    // console.log(user.password, request.body.oldPassword)
    const isValidPassword = await bcrypt.compare(request.body.oldPassword, user.password);
    if (!isValidPassword) {
      return sendError(response, 400, "Old password is incorrect");
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(request.body.newPassword, salt);
    await User.updateOne({ _id: user._id }, { password: hashedPassword });
    sendSuccess(response, 200, "Password changed successfully");
  } catch (error) {
    console.log(error)
    sendError(response, 400, "Failed to update password");
  }
}

export async function deleteUser(request: Request, response: Response) {
  console.log("Delete user endpoint hit");
  try {
    const user = await User.findByIdAndDelete(request.params.id);
    if (!user) {
      return sendError(response, 404, "User not found");
    }
    sendSuccess(response, 200, "User deleted successfully");
  } catch (error) {
    sendError(response, 400, "Failed to delete user");
  }
}

// export async function getAdmins(request: Request, response: Response) {
//   console.log("Get admins endpoint hit");
//   try {
//     const { status } = request.query;
//     const query: any = { role: "admin" };
//     if (status) {
//       query.status = status;
//     }

//     const admins = await User.find(query, { password: 0 }).sort({ createdAt: -1 });
//     response.status(200).send({ message: "Successful", admins });
//   } catch (error) {
//     console.error("Error fetching admins:", error);
//     response.status(500).send({ message: "Failed to fetch admins" });
//   }
// }

// export async function approveAdmin(request: Request, response: Response) {
//   console.log("Approve admin endpoint hit");
//   try {
//     const { id } = request.params;
//     const user = await User.findByIdAndUpdate(id, { status: "active" }, { new: true });
    
//     if (!user) {
//       return response.status(404).send({ message: "User not found" });
//     }

//     response.status(200).send({ message: "Admin approved successfully", user });
//   } catch (error) {
//     console.error("Error approving admin:", error);
//     response.status(500).send({ message: "Failed to approve admin" });
//   }
// }
