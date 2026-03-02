import { Request, Response, NextFunction } from "express";
import { AccountMembership } from "../models/AccountMembership";
import { IUser } from "../models/User";

declare global {
  namespace Express {
    interface User extends IUser {}
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: "Authentication required" });
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Authentication required" });
  }
  if ((req.user as IUser).role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}

export function requireAccountAccess(roleRequired?: "owner") {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const user = req.user as IUser;

    // Admins bypass account access checks
    if (user.role === "admin") {
      return next();
    }

    const accountId = req.params.id;
    if (!accountId) {
      return next(); // No account ID in params — skip check
    }

    const membership = await AccountMembership.findOne({
      userId: user._id,
      accountId,
    });

    if (!membership) {
      return res.status(403).json({ error: "Access denied to this account" });
    }

    if (roleRequired && membership.role !== roleRequired) {
      return res
        .status(403)
        .json({ error: "Insufficient role for this account" });
    }

    next();
  };
}
