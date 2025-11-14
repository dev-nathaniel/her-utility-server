import type { Request, Response } from "express";
import Utility from "../models/Utility.js";

export async function getUtilities(request: Request, response: Response) {
  console.log("Get users endpoint hit");
  try {
    const users = await Utility.find({}, { password: 0 }).sort({createdAt: -1});
    response.status(200).send({message: 'Successful', users});
  } catch (error) {
    response.status(400).send({ message: "Error fetching users" });
  }
}