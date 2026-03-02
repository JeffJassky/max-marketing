import { Router, Request, Response, NextFunction } from "express";
import crypto from "crypto";
import passport from "../auth/passport";
import { User } from "../models/User";
import { AccountMembership } from "../models/AccountMembership";
import { requireAuth } from "../auth/middleware";
import { sendPasswordResetEmail } from "../services/email";
import { logger } from "../logger";

const router = Router();

// POST /api/auth/login
router.post("/login", (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate(
    "local",
    (err: any, user: any, info: any) => {
      if (err) return next(err);
      if (!user) {
        return res
          .status(401)
          .json({ error: info?.message || "Invalid credentials" });
      }
      req.logIn(user, (loginErr) => {
        if (loginErr) return next(loginErr);
        res.json({
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
        });
      });
    },
  )(req, res, next);
});

// POST /api/auth/logout
router.post("/logout", requireAuth, (req: Request, res: Response) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: "Logout failed" });
    }
    req.session.destroy((sessionErr) => {
      if (sessionErr) {
        logger.error({ err: sessionErr }, "Session destroy error");
      }
      res.clearCookie("connect.sid");
      res.json({ message: "Logged out" });
    });
  });
});

// GET /api/auth/me
router.get("/me", requireAuth, async (req: Request, res: Response) => {
  const user = req.user as any;
  const memberships = await AccountMembership.find({ userId: user._id }).lean();
  res.json({
    id: user._id,
    email: user.email,
    name: user.name,
    role: user.role,
    memberships: memberships.map((m) => ({
      id: m._id,
      accountId: m.accountId,
      role: m.role,
    })),
  });
});

// POST /api/auth/forgot-password
router.post(
  "/forgot-password",
  async (req: Request, res: Response) => {
    const { email } = req.body;
    // Always return success to avoid leaking whether email exists
    res.json({ message: "If an account exists, a reset link has been sent." });

    try {
      const user = await User.findOne({ email: email?.toLowerCase() });
      if (!user) return;

      const token = crypto.randomBytes(32).toString("hex");
      const hashedToken = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

      user.resetToken = hashedToken;
      user.resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      await user.save();

      const appUrl = process.env.APP_URL || "http://localhost:5173";
      const resetUrl = `${appUrl}/reset-password?token=${token}&email=${encodeURIComponent(user.email)}`;
      await sendPasswordResetEmail(user.email, resetUrl);
    } catch (err) {
      logger.error({ err }, "Error in forgot-password");
    }
  },
);

// POST /api/auth/reset-password
router.post(
  "/reset-password",
  async (req: Request, res: Response) => {
    const { token, email, password } = req.body;

    if (!token || !email || !password) {
      return res.status(400).json({ error: "Token, email, and password are required" });
    }

    if (password.length < 8) {
      return res
        .status(400)
        .json({ error: "Password must be at least 8 characters" });
    }

    try {
      const hashedToken = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

      const user = await User.findOne({
        email: email.toLowerCase(),
        resetToken: hashedToken,
        resetTokenExpires: { $gt: new Date() },
      });

      if (!user) {
        return res
          .status(400)
          .json({ error: "Invalid or expired reset token" });
      }

      await user.setPassword(password);
      user.resetToken = undefined;
      user.resetTokenExpires = undefined;
      await user.save();

      res.json({ message: "Password reset successfully" });
    } catch (err) {
      logger.error({ err }, "Error in reset-password");
      res.status(500).json({ error: "Failed to reset password" });
    }
  },
);

export default router;
