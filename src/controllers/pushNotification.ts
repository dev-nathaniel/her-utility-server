import { Router } from "express";
import sendPushNotification from "../services/pushNotification.js";

const router = Router();


router.post("/", sendPushNotification)

export default router;
