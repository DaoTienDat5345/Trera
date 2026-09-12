import express from "express";
import { register, login, getMe, updateMe, changePassword, googleCallback } from "../../controllers/AuthController.js";
import { protect } from "../../middleware/auth.js";
import passport, { isGoogleConfigured } from "../../config/passport.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, getMe);
router.put("/me", protect, updateMe);
router.put("/me/password", protect, changePassword);

// Google OAuth
router.get("/google", (req, res, next) => {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  if (!isGoogleConfigured()) {
    return res.redirect(`${frontendUrl}/login?error=google_not_configured`);
  }
  passport.authenticate("google", { scope: ["profile", "email"], session: false })(req, res, next);
});

router.get(
  "/google/callback",
  (req, res, next) => {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    if (!isGoogleConfigured()) {
      return res.redirect(`${frontendUrl}/login?error=google_not_configured`);
    }
    passport.authenticate("google", {
      session: false,
      failureRedirect: `${frontendUrl}/login?error=google_failed`,
    })(req, res, next);
  },
  googleCallback
);

export default router;
