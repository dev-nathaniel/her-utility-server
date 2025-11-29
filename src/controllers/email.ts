import { Router } from "express";
import { createEmail } from "../services/email.js";

const router = Router()

router.post("/", createEmail)

export default router