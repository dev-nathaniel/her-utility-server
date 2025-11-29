import { Router } from "express";
import { forgotPassword, getProfile, guestLogin, isEmailExisting, login, logout, refreshToken, register, resetPassword, validateToken, verifyOtp } from "../services/auth.js"
import { verifyToken, verifyTokenAndAuthorization } from "../middlewares/verifyToken.js";


const router = Router();

router.post("/login", login);
router.post("/check-email", isEmailExisting)
router.post("/guest-login", guestLogin); 
router.post("/register", register);
router.post("/refresh-token", refreshToken);
router.post("/validate-token", validateToken);
router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", verifyOtp);
router.post("/reset-password", resetPassword);
router.post("/logout", logout)
router.get("/profile", verifyToken, getProfile);

export default router;