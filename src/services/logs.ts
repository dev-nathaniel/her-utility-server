import type { Request, Response } from "express";
import Log from "../models/Log.js";
import mongoose from "mongoose";
import { io } from "../index.js";

export type LogType = {
  // entityRef: string;
  entityType: string;
  entityId: mongoose.Types.ObjectId;
  message: string;
};

export const getAllLogs = async (request: Request, response: Response) => {
  console.log("Get all logs endpoint hit");
  try {
    const filter: any = {};
    if (request.query.approved !== undefined) {
      filter.approved = request.query.approved === "true";
    }
    if (request.query.userId) {
      filter.userId = request.query.userId;
    }
    // const logs = await Log.find(filter).populate({
    //     path: "entityId",
    //     select: "username email",
    //     match: {__t: 'User'}
    // })
    // Fetch logs in descending order (newest first)
    const logs = await Log.find(filter).sort({ createdAt: -1 });
    response.status(200).json({ message: "Successful", logs });
  } catch (error) {
    response.status(500).json({ message: "Failed to retrieve logs" });
  }
};

export const addLog = async (request: LogType) => {
  console.log("Add log function hit");
  try {
    const { entityId, entityType, message } = request;

    if (!entityId || !entityType || !message) {
      console.log("enityId or entityType or message is missing");
      return;
    }

    const log = new Log(request);
    await log.save();
    console.log("New activity has been logged");
    console.log(log.message);
    io.emit("new activity", log);
  } catch (error) {
    console.log("Error creating new activity log", error);
  }
};

//if logging fails tell user with socket or store a status that client can poll or send email or push notification
// i will use image editing and document uploading as case study
//but for now i will run logging after sending response then use socket.io to notify admins
