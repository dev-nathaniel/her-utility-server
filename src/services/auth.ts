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
      response.status(400).send({ message: "Email and password are required" });
      return;
    }
    const user = (await User.findOne({email})) as IUser & { _id: any };
    if (!user) {
      console.log("Invalid credentials")
      response.status(401).send({ message: "Invalid credentials" });
      return;
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      console.log("Invalid credentials")
      response.status(401).send({ message: "Invalid credentials" });
      return;
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

    response.status(200).send({
      message: "Login successful",
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
    response.status(500).send({ message: "Login failed" });
  }
}

export async function isEmailExisting(request: Request, response: Response) {
  console.log("Validate Email Endpoint Hit");
  try {
    const { email } = request.body;
    if (!email) {
      response.status(400).send({ message: "email is required"})
      return
    }
    const existingUser = await User.findOne({email})
    if (existingUser) {
      response.status(409).send({message: "User with this email already exists"})
      return
    }
    response.status(200).send({message: "New user", email: email})
  } catch (error) {
    console.log("Error during email check:", error);
    response.status(500).send({ message: "Email CHeck failed" });
  }
}

export async function register(request: Request, response: Response) {
  console.log("Register Endpoint Hit");
  try {
    const { fullname, email, password, role } = request.body;
    console.log("Request body:", request.body);
    if (!fullname || !email || !password) {
      response
        .status(400)
        .send({ message: "Fullname, email, and password are required" });
      return;
    }
    // Check if user already exists by email or username
    const existingUser = await User.findOne({email});
    if (existingUser) {
      response
        .status(409)
        .send({ message: "User with this email or username already exists" });
      return;
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

    response.status(201).send({
      message: "User created successfully",
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
    response.status(400).send({ message: "Registration failed" });
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
          response.status(404).send({ message: "Guest user not found" });
          return;
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
        response.status(200).send({
          message: "Guest login successful",
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
        response
          .status(500)
          .send({ message: "Failed to generate unique guest username" });
        return;
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

    response.status(201).send({
      message: "Guest user created successfully",
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
    response.status(400).send({ message: "Guest login failed" });
  }
}

// In-memory store for OTPs (for demo; use persistent store in production)
// const otpStore: { [email: string]: { otp: string; expiresAt: number } } = {};

export async function forgotPassword(request: Request, response: Response) {
  console.log("Forgot Password (OTP) Endpoint Hit");
  try {
    const { email } = request.body;
    if (!email) {
      response.status(400).send({ message: "Email is required" });
      return;
    }

    const user = (await User.findOne({ email })) as typeof User.prototype & {
      _id: any;
    };
    if (!user) {
      response.status(404).send({ message: "User not found" });
      return;
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

    response.status(200).send({
      message: "OTP sent to email",
    });
  } catch (error) {
    response.status(400).send({ message: "OTP generation failed" });
  }
}

export async function verifyOtp(request: Request, response: Response) {
  console.log("Verify OTP Endpoint Hit");
  try {
    const { email, otp } = request.body;
    if (!email || !otp) {
      response.status(400).send({ message: "Email and OTP are required" });
      return;
    }

    const user = await User.findOne({ email });

    const foundOTP = await OTP.findOne({
      code: otp,
      userId: user?._id,
      used: false,
    });
    if (!foundOTP) {
      response.status(400).send({ message: "OTP not found or expired" });
      return;
    }

    if (Date.now() > foundOTP.expiresAt.getTime()) {
      await OTP.deleteOne({ _id: foundOTP._id });
      response.status(400).send({ message: "OTP expired" });
      return;
    }

    if (foundOTP.code !== otp) {
      response.status(400).send({ message: "Invalid OTP" });
      return;
    }

    // OTP is valid
    await OTP.deleteOne({ _id: foundOTP._id });

    response.status(200).send({ message: "OTP verified successfully" });
  } catch (error) {
    response.status(400).send({ message: "Failed to verify OTP" });
  }
}

export async function resetPassword(request: Request, response: Response) {
  console.log("Reset Password Endpoint Hit");
  try {
    const { email, newPassword } = request.body;
    if (!email || !newPassword) {
      response
        .status(400)
        .send({ message: "Email and new password are required" });
      return;
    }
    const user = await User.findOne({ email });
    if (!user) {
      response.status(404).send({ message: "User not found" });
      return;
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    user.password = hashedPassword;
    await user.save();
    response.status(200).send({ message: "Password reset successfully" });
  } catch (error) {
    response.status(400).send({ message: "Failed to reset password" });
  }
}

export async function validateToken(request: Request, response: Response) {
  console.log("Validate Token Endpoint Hit");
  const token = request.headers.authorization;
  if (!token) {
    response.status(401).send({ message: "Unauthorized" });
    return;
  }
  try {
    const decoded = await jwt.verify(token, jwt_secret_key);
    // console.log(decoded)
    const user = await User.findById((decoded as any)?.userId, { password: 0 }); // Exclude password from the response
    if (!user) {
      response.status(404).send({ message: "User not found" });
      return;
    }
    // console.log(user)
    response.status(200).send({ message: "Token is valid", user });
  } catch (error) {
    response.status(401).send({ message: "Invalid token" });
  }
}

export async function refreshToken(request: Request, response: Response) {
  console.log("Refresh Token Endpoint Hit");
  let token = request.headers.authorization;
  console.log(token)
  if (!token) {
    response.status(401).send({ message: "Unauthorized" });
    return;
  }
  if (token.startsWith("Bearer")) {
    token = token.slice(7).trim()
  } else {
    response.status(401).send({ message: "Unauthorized" })
    return
  }
  try {
    // console.log("Token received:", token);
    const refreshTokenDoc = await RefreshToken.findOne({ token })
    if (!refreshTokenDoc) {
      response.status(401).json({ message: "Refresh token not found"})
      return;
    }
    if (!refreshTokenDoc.isValid) {
      response.status(401).json({ message: "Refresh token revoked" })
      return
    }
    if (refreshTokenDoc.expiresAt.getTime() < Date.now()) {
      refreshTokenDoc.isValid = false
      await refreshTokenDoc.save()
      response.status(401).json({ message: "Refresh token expired" })
      return
    }
    const decoded = jwt.verify(token, jwt_refresh_secret_key);
    // console.log("Decoded token:", decoded);
    const payload: Payload = {
      userId: (decoded as any).userId,
      role: (decoded as any).role,
    };
    const newToken = jwt.sign(payload, jwt_secret_key, { expiresIn: "1h" });
    response.status(200).send({ message: "Token refreshed", token: newToken });
  } catch (error: any) {
    // console.error("Error refreshing token:", error);
    if (error.name === "TokenExpiredError") {
      response.status(401).json({ message: "Token has expired" });
    } else if (error.name === "JsonWebTokenError") {
      response.status(401).json({ message: "Invalid token" });
    } else {
      response.status(500).json({ message: "Refresh token failed" });
    }
    // response.status(401).send({ message: error.message, error: error.name });
  }
}

export async function logout(request: Request, response: Response) {
  console.log("Logout endpoint hit")
  try {
    let token = request.headers.authorization
    if (!token) {
      response.status(400).send({ message: "Refresh token required to logout" })
      return
    }
    if (token.startsWith("Bearer ")) {
      token = token.slice(7).trim()
    } else {
      response.status(401).json({ message: "Unauthorized" })
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
      response.status(200).send({ message: "Logout successfully" })
      return
    }
    refreshTokenDoc.isValid = false
    await refreshTokenDoc.save()

    response.status(200).send({ message: "Logout successfully"})
  } catch (error) {
    response.status(500).send({ message: "Logout failed"})
  }
}
