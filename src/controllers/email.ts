import { Router } from "express";
import { createEmail, listEmails, createTemplate, listTemplates } from "../services/email.js";
import { verifyToken, verifyTokenAndAdmin } from "../middlewares/verifyToken.js";

const router = Router();

// Protect these routes with admin verification
router.post("/", verifyToken, createEmail);
router.get("/", verifyToken, listEmails);

router.post("/templates", verifyToken, createTemplate);
router.get("/templates", verifyToken, listTemplates);

export default router;