import type { Request, Response } from "express";
import { Router } from "express";
import authRouter from "./auth.js";
import userRouter from "./users.js";
import businessRouter from "./businesses.js"
import inviteRouter from "./invites.js"
import dashboardRouter from "./dashboard.js";
import logRouter from "./logs.js";
import pushNotificationRouter from "./pushNotification.js";
import quotesRouter from "./quotes.js";
import sitesRouter from "./sites.js";
import utilitiesRouter from "./utilities.js";
import emailRouter from "./email.js"


const router = Router();


router.get("/", (request: Request, response: Response) => {
  response.send({ message: "Active" });
});
// console.log("Controllers loaded");

router.use("/auth", authRouter);
router.use("/users", userRouter);
router.use("/businesses", businessRouter);
router.use("/dashboard", dashboardRouter);
router.use("/logs", logRouter);
router.use("/quotes", quotesRouter);
router.use("/sites", sitesRouter);
router.use("/utilities", utilitiesRouter);
router.use("/invites", inviteRouter)
router.use("/push-notification", pushNotificationRouter);
router.use("/email", emailRouter)

export default router;
