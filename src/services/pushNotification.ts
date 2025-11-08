//Send expo push notification

import type { Request, Response } from "express";
import User from "../models/User.js";
import { sendPushNotification as sendPushNotificationUtils } from "../utils/sendPushNotification.js";
import {Expo} from "expo-server-sdk";

const sendPushNotification = async (request: Request, response: Response) => {
  try {
    const { token, title, subtitle, message } = request.body;
    let tokens: string[] = [];

    if (token) {
      // Send to a single token (for testing or admin use)
      if (!Expo.isExpoPushToken(token)) {
        response.status(400).json({
          success: false,
          message: "Invalid token"
        });
        return;
      }
      tokens = [token];
    } else {
      // Send to all users
      const users = await User.find({ expoPushTokens: { $exists: true, $ne: [] } }, { expoPushTokens: 1 });
      tokens = users.flatMap(user => user.expoPushTokens || []);
      // Filter for valid Expo tokens
      tokens = tokens.filter(t => Expo.isExpoPushToken(t));
      if (tokens.length === 0) {
        response.status(400).json({
          success: false,
          message: "No valid Expo push tokens found for users"
        });
        return;
      }
    }

    await sendPushNotificationUtils({
      tokens: tokens,
      title: title,
      subtitle: subtitle,
      message: message
    });

    response.status(200).json({
      success: true,
      message: token ? "Push notification sent successfully" : "Push notifications sent to all users successfully"
    });
    return;
  } catch (error) {
    console.error(error);
    response.status(500).json({
      success: false,
      message: "Failed to send push notification"
    });
    return;
  }
};

export default sendPushNotification;
