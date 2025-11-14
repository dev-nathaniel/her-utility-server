import type { Request, Response } from "express";
import Invite from "../models/Invite.js";

export async function getInvites(request: Request, response: Response) {
  console.log("Get users endpoint hit");
  try {
    const users = await Invite.find({}, { password: 0 }).sort({createdAt: -1});
    response.status(200).send({message: 'Successful', users});
  } catch (error) {
    response.status(400).send({ message: "Error fetching users" });
  }
}