import type { Request, Response } from "express";
import { Router } from "express";
import authRouter from "./auth.js";
import userRouter from "./users.js";
import dashboardRouter from "./dashboard.js";
import logRouter from "./logs.js";
import pushNotificationRouter from "./pushNotification.js";
import quotesRouter from "./quotes.js";
import sitesRouter from "./sites.js";

const router = Router();

router.get("/", (request: Request, response: Response) => {
  response.send({ message: "Active" });
});

router.use("/auth", authRouter);
router.use("/users", userRouter);
router.use("/businesses", userRouter);
router.use("/dashboard", dashboardRouter);
router.use("/logs", logRouter);
router.use("/quotes", quotesRouter);
router.use("/sites", sitesRouter);
router.use("/utilities", sitesRouter);
router.use("/push-notification", pushNotificationRouter);

export default router;
