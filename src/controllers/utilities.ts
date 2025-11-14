import { Router } from "express";
import { verifyToken, verifyTokenAndAuthorization } from "../middlewares/verifyToken.js";
import { getUtilities } from "../services/utilities.js";


const router = Router();

// router.post("/", );
router.get("/", getUtilities);
// router.get("/:id", ); 
// router.put("/:id", );
// router.delete("/:id", );

export default router;