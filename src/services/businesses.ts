import type { Request, Response } from "express"
import User from "../models/User.js"
import mongoose from "mongoose"
import Business from "../models/Business.js"

export const createBusiness = async (request: Request, response: Response) => {
    try {
        const {name, address, members} = request.body
        if (!members || !name || !address) {
            return response.status(400).json({ message: "Missing required fields." })
        }
        if (!Array.isArray(members) || members.length === 0) {
            return response.status(400).json({ message: "members must be a non-empty array of user ids and role"})
        }
        //check if there is userId and/or role
        console.log(members, 'members')
        const membersIds = Array.from(new Set(members.map((member) => String(member.userId).trim())))
        console.log(membersIds, 'members ids')
        const invalidIds = membersIds.filter((id) => !mongoose.Types.ObjectId.isValid(id))
        console.log(invalidIds, 'invalid Ids')

        if (invalidIds.length) {
            return response.status(400).json({ message: "Invalid user id(s) provided", invalidIds})
        }
        const users = await User.find({ _id: { $in: membersIds}}).select("_id")
        const foundIds = new Set(users.map(user => String(user._id)))
        const missing = membersIds.filter(id => !foundIds.has(id))
        if (missing.length) {
            return response.status(400).json({ message: "Some users were not found.", missing })
        }

        const businessDoc = await Business.create({
            name,
            address,
            members
        })

        await User.updateMany(
            { _id: { $in: membersIds } },
            { $addToSet: { businesses: businessDoc._id } }
        )

        return response.status(201).json({ message: "Business created", business: businessDoc })
    } catch (error) {
        console.error("createBusiness error:", error)
        return response.status(500).json({ message: "Failed to create a business" })
    }
}