import { Router } from "express";
import { verifyToken } from "../middlewares/verifyToken.js";
import { getUtilities, getUtility, createUtility } from "../services/utilities.js";

const router = Router();

router.post("/", verifyToken, createUtility);
router.get("/", verifyToken, getUtilities);
router.get("/:id", verifyToken, getUtility); 
// router.put("/:id", );
// router.delete("/:id", );

export default router;