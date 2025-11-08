import type { Request, Response } from "express";
import User from "../models/User.js";
import mongoose from "mongoose";
import bcrypt from "bcrypt";

export async function getUsers(request: Request, response: Response) {
  console.log("Get users endpoint hit");
  try {
    const users = await User.find({}, { password: 0 }).sort({createdAt: -1});
    response.status(200).send({message: 'Successful', users});
  } catch (error) {
    response.status(400).send({ message: "Error fetching users" });
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
      response.status(404).send({ message: "User not found" });
      return;
    }
    response.status(200).send({message: 'Successful', user});
  } catch (error) {
    response.status(400).send({ message: "Failed to get user" });
  }
}

export async function updateUser(request: Request, response: Response) {
  console.log("Update user endpoint hit");
  try {
    const user = (await User.findById(
      request.params.id
    )) as typeof User.prototype & { _id: any };
    if (!user) {
      response.status(404).send({ message: "User not found" });
      return;
    }
    let updatedData = request.body;

    if (updatedData.password) {
      response.status(400).send({ message: "Cannot update password"})
      return;
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
      response.status(404).send({ message: "User not found" });
      return;
    }
    response.status(200).send({message: 'User successfully updated', updatedUser});
  } catch (error) {
    response.status(400).send({ message: "Failed to update user" });
  }
}

export async function changePassword(request: Request, response: Response) {
  console.log("Change password endpoint hit")
  try {
    const user = await User.findById(request.params.id);
    if (!user) {
      response.status(404).send({ message: "User not found" });
      return;
    }
    // console.log(user.password, request.body.oldPassword)
    const isValidPassword = await bcrypt.compare(request.body.oldPassword, user.password);
    if (!isValidPassword) {
      response.status(400).send({ message: "Old password is incorrect" });
      return;
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(request.body.newPassword, salt);
    user.password = hashedPassword;
    await user.save();
    response.status(200).send({ message: "Password changed successfully" });
  } catch (error) {
    console.log(error)
    response.status(400).send({ message: "Failed to update password"})
  }
}

export async function deleteUser(request: Request, response: Response) {
  console.log("Delete user endpoint hit");
  try {
    const user = await User.findByIdAndDelete(request.params.id);
    if (!user) {
      response.status(404).send({ message: "User not found" });
      return;
    }
    response.status(200).send({ message: "User deleted successfully" });
  } catch (error) {
    response.status(400).send({ message: "Failed to delete user" });
  }
}

// export async function createUser(
//   request: Request<{}, {}, {}, CreateUserQueryParams>,
//   response: Response
// ) {
//   response.status(201).send({
//     id: 1,
//     username: "test",
//     email: "test@gmail.com",
//   });
// }
