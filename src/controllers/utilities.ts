import { Router } from "express";
import { verifyToken } from "../middlewares/verifyToken.js";
import { getUtilities, getUtility, createUtility } from "../services/utilities.js";

const router = Router();

router.post("/", verifyToken, createUtility);
router.get("/", getUtilities);
router.get("/:id", getUtility); 
// router.put("/:id", );
// router.delete("/:id", );

export default router;