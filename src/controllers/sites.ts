import express from "express";
import { fetchSiteDetails, fetchSitesForUser, inviteToSite } from "../services/sites.js";
import { verifyToken } from "../middlewares/verifyToken.js";
const router = express.Router();

// Invite a user to a site by email and role
// router.post("/:siteId/invite", async (req, res) => {
//   try {
//     const { email, role } = req.body; // role: owner | manager | viewer
//     const siteId = req.params.siteId;
//     const invitedBy = req.body.invitedBy; // optional: userId of inviter
//     if (!email || !role) return res.status(400).json({ error: "email and role are required" });

//     const invite = await inviteToSite(siteId, email, role, invitedBy);
//     return res.status(200).json(invite);
//   } catch (err) {
//     console.error(err);
//     return res.status(500).json({ error: "Failed to invite user" });
//   }
// });

router.get("/", verifyToken, fetchSitesForUser)
// router.post("/")
router.get("/:id", verifyToken, fetchSiteDetails)
// router.put("/:id")
// router.delete("/:id")

export default router;