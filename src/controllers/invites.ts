import { Router } from "express";
import { verifyToken, verifyTokenAndAuthorization } from "../middlewares/verifyToken.js";
import { getInvites } from "../services/invites.js";


const router = Router();

router.post("/", getInvites);
// router.get("/", );
// router.get("/:id", ); 
// router.get("/:id/members", ); 
// router.get("/:id/members/:userId/role", ); 
// router.get("/:id/members/:userId", ); 
// router.put("/:id", );
// router.delete("/:id", );

export default router;