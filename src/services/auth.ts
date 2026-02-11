import type { Request, Response } from "express";
import User, { type IUser } from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { sendEmail } from "../utils/sendEmail.js";
import OTP from "../models/OTP.js";
import RefreshToken, { type IRefreshToken } from "../models/RefreshToken.js";
import mongoose from "mongoose";
import { addLog } from "./logs.js";
import { sendSuccess, sendError } from "../utils/response-helper.js";

dotenv.config();

const jwt_secret_key = process.env.SECRET_KEY!;
// console.log("JWT Secret Key:", jwt_secret_key);
const jwt_refresh_secret_key = process.env.REFRESH_SECRET_KEY!;

if (!jwt_secret_key || !jwt_refresh_secret_key) {
  throw new Error("Missing secret keys");
}

export interface Payload {
  userId: string;
  role: string;
}

export async function login(request: Request, response: Response) {
  console.log("Login Endpoint Hit");
  try {
    const { email, password } = request.body;
    if (!password || !email) {
      console.log("Email and password required")
      return sendError(response, 400, "Email and password are required");
    }
    const user = (await User.findOne({email})) as IUser & { _id: any };
    if (!user) {
      console.log("Invalid credentials")
      return sendError(response, 401, "Invalid credentials");
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      console.log("Invalid credentials")
      return sendError(response, 401, "Invalid credentials");
    }

    const payload: Payload = {
      userId: user._id.toString(),
      role: user.role,
    };
    const token = jwt.sign(payload, jwt_secret_key, { expiresIn: "1h" });
    const refreshToken = jwt.sign(payload, jwt_refresh_secret_key, {
      expiresIn: "7d",
    });

    const refreshTokenDoc = (await RefreshToken.create({
      token: refreshToken,
      userId: user._id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 
      isValid: true
    })) as IRefreshToken & {_id: any}

    user.refreshTokens = user.refreshTokens.concat(refreshTokenDoc._id as any)

    await user.save()

    sendSuccess(response, 200, "Login successful", {
      user: {
        id: user._id,
        fullname: user.fullname,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture,
        expoPushTokens: user.expoPushTokens,
      },
      token,
      refreshToken,
    });
  } catch (error) {
      console.log("Login failed")
    sendError(response, 500, "Login failed");
  }
}

export async function isEmailExisting(request: Request, response: Response) {
  console.log("Validate Email Endpoint Hit");
  try {
    const { email } = request.body;
    if (!email) {
      return sendError(response, 400, "Email is required");
    }
    const existingUser = await User.findOne({email})
    if (existingUser) {
      return sendError(response, 409, "User with this email already exists");
    }
    sendSuccess(response, 200, "New user", { email });
  } catch (error) {
    console.log("Error during email check:", error);
    sendError(response, 500, "Email check failed");
  }
}

export async function register(request: Request, response: Response) {
  console.log("Register Endpoint Hit");
  try {
    const { fullname, email, password, role } = request.body;
    console.log("Request body:", request.body);
    if (!fullname || !email || !password) {
      return sendError(response, 400, "Fullname, email, and password are required");
    }
    // Check if user already exists by email or username
    const existingUser = await User.findOne({email});
    if (existingUser) {
      return sendError(response, 409, "User with this email or username already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // if (!mongoose.connection.db) {
    //   response
    //     .status(500)
    //     .send({ message: "Database connection is not established" });
    //   return;
    // }

    const user = new User({
      fullname,
      email,
      password: hashedPassword,
      role,
    }) as IUser & { _id: any };

    await user.save();

    const payload: Payload = {
      userId: user._id.toString(),
      role: user.role,
    };
    const token = jwt.sign(payload, jwt_secret_key, { expiresIn: "1h" });
    const refreshToken = jwt.sign(payload, jwt_refresh_secret_key, {
      expiresIn: "7d",
    });

    sendSuccess(response, 201, "User created successfully", {
      user: {
        id: user._id,
        fullname: user.fullname,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture,
        expoPushTokens: user.expoPushTokens,
      },
      token,
      refreshToken,
    });
    // addLog({
    //   entityId: user._id,
    //   entityType: "User",
    //   message: `New user ${user.username} registered`,
    // });
  } catch (error) {
    console.log("Error during registration:", error);
    sendError(response, 400, "Registration failed");
  }
}

export async function guestLogin(request: Request, response: Response) {
  //we can store something in local storage to identify the guest user
  // and then use that to login the user in later if guest login is chosen
  // login as guest_some_random_string
  // but they loose their data if they don't register/upgrade to a full account
  console.log("Guest Login Endpoint Hit");
  try {
    if (request.body) {
      const { username } = request.body;
      if (username) {
        const guestUser = (await User.findOne({
          username: username,
        })) as typeof User.prototype & { _id: any };
        if (!guestUser) {
          return sendError(response, 404, "Guest user not found");
        }
        const payload: Payload = {
          userId: guestUser._id.toString(),
          role: guestUser.role,
        };
        const token = jwt.sign(payload, jwt_secret_key, { expiresIn: "1h" });
        const refreshToken = jwt.sign(payload, jwt_refresh_secret_key, {
          expiresIn: "7d",
        });

        const refreshTokenDoc = await RefreshToken.create({
          token: refreshToken,
          userId: guestUser._id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          isValid: true
        })

        guestUser.refreshTokens = guestUser.refreshTokens.concat(refreshTokenDoc._id)

        await guestUser.save()
        sendSuccess(response, 200, "Guest login successful", {
          user: {
            id: guestUser._id,
            username: guestUser.username,
            email: guestUser.email,
            role: guestUser.role,
            profilePicture: guestUser.profilePicture,
            expoPushTokens: guestUser.expoPushTokens,
          },
          token,
          refreshToken,
        });
        return;
      }
    }

    // Generate a random username and email for the guest user
    const guestUsername = `guest_${Math.random()
      .toString(36)
      .substring(2, 15)}`;
    const guestPassword = "guest_password"; // Default password for guest users
    const guestRole = "guest"; // Default role for guest users
    // Check if a guest user already exists
    let existingGuestUser = await User.findOne({
      username: guestUsername,
    });
    let uniqueGuestUsername = guestUsername;
    let tries = 0;
    while (existingGuestUser) {
      uniqueGuestUsername = `guest_${Math.random()
        .toString(36)
        .substring(2, 15)}`;
      // Check again if this username exists
      existingGuestUser = await User.findOne({ username: uniqueGuestUsername });
      // if (!existingGuestUser) break;
      tries++;
      if (tries > 10) {
        return sendError(response, 500, "Failed to generate unique guest username");
      }
    }
    const guestEmail = `${uniqueGuestUsername}@example.com`;
    // If no guest user exists, create a new one
    const hashedPassword = await bcrypt.hash(guestPassword, 10);
    const guestUser = new User({
      username: uniqueGuestUsername,
      password: hashedPassword,
      email: guestEmail,
      role: guestRole,
    }) as typeof User.prototype & { _id: any };
    // If there is a file, try to upload it
    // if (request.file && request.file.buffer) {
    //   const uploadStream = new UploadStream(request.file.buffer);
    //   guestUser.profilePicture = uploadStream.id;
    // }

    await guestUser.save();

    const payload: Payload = {
      userId: guestUser._id.toString(),
      role: guestUser.role,
    };
    const token = jwt.sign(payload, jwt_secret_key, { expiresIn: "1h" });
    const refreshToken = jwt.sign(payload, jwt_refresh_secret_key, {
      expiresIn: "7d",
    });

    const refreshTokenDoc = await RefreshToken.create({
      token: refreshToken,
      userId: guestUser._id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      isValid: true
    })

    guestUser.refreshTokens = guestUser.refreshTokens.concat(refreshTokenDoc._id)
    await guestUser.save()

    sendSuccess(response, 201, "Guest user created successfully", {
      user: {
        id: guestUser._id,
        username: guestUser.username,
        email: guestUser.email,
        role: guestUser.role,
        profilePicture: guestUser.profilePicture,
        expoPushTokens: guestUser.expoPushTokens,
      },
      token,
      refreshToken,
    });
  } catch (error) {
    console.log("Error during guest login:", error);
    sendError(response, 400, "Guest login failed");
  }
}

// In-memory store for OTPs (for demo; use persistent store in production)
// const otpStore: { [email: string]: { otp: string; expiresAt: number } } = {};

export async function forgotPassword(request: Request, response: Response) {
  console.log("Forgot Password (OTP) Endpoint Hit");
  try {
    const { email } = request.body;
    if (!email) {
      return sendError(response, 400, "Email is required");
    }

    const user = (await User.findOne({ email })) as typeof User.prototype & {
      _id: any;
    };
    if (!user) {
      return sendError(response, 404, "User not found");
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes

    await new OTP({
      code: otp,
      userId: user._id,
      expiresAt: new Date(expiresAt),
      medium: "email",
      type: "forgot-password",
      used: false,
    }).save();

    await sendEmail({
      from: "adebayoolowofoyeku@gmail.com",
      to: user.email,
      subject: "Password Reset OTP",
      html: `
      <div style="background: #f4f8fb; padding: 40px 0;">
        <table align="center" width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px; background: #fff; border-radius: 10px; box-shadow: 0 2px 8px rgba(69,155,251,0.08); overflow: hidden;">
        <tr>
          <td style="background: #459bfb; padding: 24px 0; text-align: center;">
          <h1 style="color: #fff; margin: 0; font-family: Arial, sans-serif; font-size: 28px; letter-spacing: 1px;">Breakthrough Family</h1>
          </td>
        </tr>
        <tr>
          <td style="padding: 32px 32px 24px 32px; font-family: Arial, sans-serif; color: #222;">
          <h2 style="color: #459bfb; margin-top: 0; font-size: 22px;">Password Reset Request</h2>
          <p style="font-size: 16px; color: #444;">Hello,</p>
          <p style="font-size: 16px; color: #444;">
            We received a request to reset your password. Please use the OTP below to proceed. This code is valid for <b>15 minutes</b>.
          </p>
          <div style="margin: 32px 0; text-align: center;">
            <span style="display: inline-block; background: #459bfb; color: #fff; font-size: 28px; letter-spacing: 8px; padding: 16px 32px; border-radius: 8px; font-weight: bold;">
            ${otp}
            </span>
          </div>
          <p style="font-size: 15px; color: #888;">
            If you did not request a password reset, please ignore this email or contact support.
          </p>
          <p style="font-size: 15px; color: #888; margin-bottom: 0;">
            Thank you,<br>
            <span style="color: #459bfb;">Breakthrough Family Team</span>
          </p>
          </td>
        </tr>
        <tr>
          <td style="background: #f4f8fb; text-align: center; padding: 16px 0; font-size: 13px; color: #aaa;">
          &copy; ${new Date().getFullYear()} Breakthrough Family. All rights reserved.
          </td>
        </tr>
        </table>
      </div>
      `,
    });

    sendSuccess(response, 200, "OTP sent to email");
  } catch (error) {
    sendError(response, 400, "OTP generation failed");
  }
}

export async function verifyOtp(request: Request, response: Response) {
  console.log("Verify OTP Endpoint Hit");
  try {
    const { email, otp } = request.body;
    if (!email || !otp) {
      return sendError(response, 400, "Email and OTP are required");
    }

    const user = await User.findOne({ email });

    const foundOTP = await OTP.findOne({
      code: otp,
      userId: user?._id,
      used: false,
    });
    if (!foundOTP) {
      return sendError(response, 400, "OTP not found or expired");
    }

    if (Date.now() > foundOTP.expiresAt.getTime()) {
      await OTP.deleteOne({ _id: foundOTP._id });
      return sendError(response, 400, "OTP expired");
    }

    if (foundOTP.code !== otp) {
      return sendError(response, 400, "Invalid OTP");
    }

    // OTP is valid
    await OTP.deleteOne({ _id: foundOTP._id });

    sendSuccess(response, 200, "OTP verified successfully");
  } catch (error) {
    sendError(response, 400, "Failed to verify OTP");
  }
}

export async function resetPassword(request: Request, response: Response) {
  console.log("Reset Password Endpoint Hit");
  try {
    const { email, newPassword } = request.body;
    if (!email || !newPassword) {
      return sendError(response, 400, "Email and new password are required");
    }
    const user = await User.findOne({ email });
    if (!user) {
      return sendError(response, 404, "User not found");
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    user.password = hashedPassword;
    await user.save();
    sendSuccess(response, 200, "Password reset successfully");
  } catch (error) {
    sendError(response, 400, "Failed to reset password");
  }
}

export async function validateToken(request: Request, response: Response) {
  console.log("Validate Token Endpoint Hit");
  const token = request.headers.authorization;
  if (!token) {
    return sendError(response, 401, "Unauthorized");
  }
  try {
    const decoded = await jwt.verify(token, jwt_secret_key);
    // console.log(decoded)
    const user = await User.findById((decoded as any)?.userId, { password: 0 }); // Exclude password from the response
    if (!user) {
      return sendError(response, 404, "User not found");
    }
    sendSuccess(response, 200, "Token is valid", { user });
  } catch (error) {
    sendError(response, 401, "Invalid token");
  }
}

export async function refreshToken(request: Request, response: Response) {
  console.log("Refresh Token Endpoint Hit");
  let token = request.headers.authorization;
  console.log(token)
  if (!token) {
    return sendError(response, 401, "Unauthorized");
  }
  if (token.startsWith("Bearer")) {
    token = token.slice(7).trim()
  } else {
    return sendError(response, 401, "Unauthorized");
  }
  try {
    // console.log("Token received:", token);
    const refreshTokenDoc = await RefreshToken.findOne({ token })
    if (!refreshTokenDoc) {
      return sendError(response, 401, "Refresh token not found");
    }
    if (!refreshTokenDoc.isValid) {
      return sendError(response, 401, "Refresh token revoked");
    }
    if (refreshTokenDoc.expiresAt.getTime() < Date.now()) {
      refreshTokenDoc.isValid = false
      await refreshTokenDoc.save()
      return sendError(response, 401, "Refresh token expired");
    }
    const decoded = jwt.verify(token, jwt_refresh_secret_key);
    // console.log("Decoded token:", decoded);
    const payload: Payload = {
      userId: (decoded as any).userId,
      role: (decoded as any).role,
    };
    const newToken = jwt.sign(payload, jwt_secret_key, { expiresIn: "1h" });
    sendSuccess(response, 200, "Token refreshed", { token: newToken });
  } catch (error: any) {
    // console.error("Error refreshing token:", error);
    if (error.name === "TokenExpiredError") {
      sendError(response, 401, "Token has expired");
    } else if (error.name === "JsonWebTokenError") {
      sendError(response, 401, "Invalid token");
    } else {
      sendError(response, 500, "Refresh token failed");
    }
    // response.status(401).send({ message: error.message, error: error.name });
  }
}

export async function logout(request: Request, response: Response) {
  console.log("Logout endpoint hit")
  try {
    let token = request.headers.authorization
    if (!token) {
      return sendError(response, 400, "Refresh token required to logout");
    }
    if (token.startsWith("Bearer ")) {
      token = token.slice(7).trim()
    } else {
      return sendError(response, 401, "Unauthorized");
    }
    //fix later only the user should be able to log out
    
    // jwt.verify(token, jwt_refresh_secret_key, (err, user) => {
    //   if (err) {
    //     response.status(403).json({ message: "Token is not valid" })
    //     return
    //   }
    //   if ((user as any)?.userId === request.params.id || (request?.user as any)?.role === 'admin') {
    //         next();
    //     } else {
    //         response.status(403).json({message: "You are not authorized!"});
    //     }
    // })

    const refreshTokenDoc = await RefreshToken.findOne({ token })
    if (!refreshTokenDoc) {
      return sendSuccess(response, 200, "Logout successfully");
    }
    refreshTokenDoc.isValid = false
    await refreshTokenDoc.save()

    sendSuccess(response, 200, "Logout successfully");
  } catch (error) {
    sendError(response, 500, "Logout failed");
  }
}

export async function getProfile(request: Request, response: Response) {
  console.log("Get Profile Endpoint Hit");
  try {
    const userId = (request.user as any)?.userId;
    if (!userId) {
      return sendError(response, 400, "User ID missing from token");
    }

    const user = await User.findById(userId).select("-password");
    if (!user) {
      return sendError(response, 404, "User not found");
    }

    sendSuccess(response, 200, "Profile fetched successfully", { user });
  } catch (error) {
    console.error("Error fetching profile:", error);
    sendError(response, 500, "Failed to fetch profile");
  }
}
