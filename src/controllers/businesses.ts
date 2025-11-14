import { Router } from "express";
import { verifyToken, verifyTokenAndAuthorization } from "../middlewares/verifyToken.js";
import { createBusiness, fetchBusinessesForUser } from "../services/businesses.js";


const router = Router();

router.post("/", verifyToken, createBusiness);
router.get("/", verifyToken, fetchBusinessesForUser);
// router.get("/:id", ); 
// router.get("/:id/members", ); 
// router.get("/:id/members/:userId/role", ); 
// router.get("/:id/members/:userId", ); 
// router.put("/:id", );
// router.delete("/:id", );

export default router;