import { Router } from "express";
import { verifyToken, verifyTokenAndAuthorization } from "../middlewares/verifyToken.js";
import { changePassword, deleteUser, getUserById, getUsers, updateUser } from "../services/users.js";

const router = Router();

router.get("/", verifyToken, getUsers);
router.get("/:id", verifyToken, getUserById);
router.put("/:id", verifyTokenAndAuthorization, updateUser);
router.put("/change-password/:id", verifyTokenAndAuthorization, changePassword);
router.delete("/:id", verifyTokenAndAuthorization, deleteUser);

export default router;