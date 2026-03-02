import { Router, Request, Response } from "express";
import { User } from "../models/User";
import { AccountMembership } from "../models/AccountMembership";
import { requireAdmin } from "../auth/middleware";

const router = Router();

// All admin routes require admin role
router.use(requireAdmin);

// GET /api/admin/users — list all users with their memberships
router.get("/users", async (_req: Request, res: Response) => {
  try {
    const users = await User.find({}, "-passwordHash -resetToken -resetTokenExpires").lean();
    const memberships = await AccountMembership.find({}).lean();

    const result = users.map((u) => ({
      id: u._id,
      email: u.email,
      name: u.name,
      role: u.role,
      createdAt: u.createdAt,
      memberships: memberships
        .filter((m) => m.userId.toString() === u._id.toString())
        .map((m) => ({
          id: m._id,
          accountId: m.accountId,
          role: m.role,
        })),
    }));

    res.json(result);
  } catch (err) {
    console.error("Error listing users:", err);
    res.status(500).json({ error: "Failed to list users" });
  }
});

// POST /api/admin/users — create a user
router.post("/users", async (req: Request, res: Response) => {
  try {
    const { email, name, role, password, accountIds } = req.body;

    if (!email || !name || !password) {
      return res
        .status(400)
        .json({ error: "Email, name, and password are required" });
    }

    if (password.length < 8) {
      return res
        .status(400)
        .json({ error: "Password must be at least 8 characters" });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: "A user with this email already exists" });
    }

    const user = new User({
      email: email.toLowerCase(),
      name,
      role: role || "user",
      passwordHash: "placeholder",
    });
    await user.setPassword(password);
    await user.save();

    // Create account memberships
    if (accountIds && Array.isArray(accountIds)) {
      const membershipDocs = accountIds.map((accountId: string) => ({
        userId: user._id,
        accountId,
        role: "owner" as const,
      }));
      await AccountMembership.insertMany(membershipDocs);
    }

    res.status(201).json({
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
    });
  } catch (err) {
    console.error("Error creating user:", err);
    res.status(500).json({ error: "Failed to create user" });
  }
});

// PUT /api/admin/users/:userId — update a user
router.put("/users/:userId", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { name, email, role } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (name) user.name = name;
    if (email) user.email = email.toLowerCase();
    if (role && (role === "admin" || role === "user")) user.role = role;
    await user.save();

    res.json({
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
    });
  } catch (err) {
    console.error("Error updating user:", err);
    res.status(500).json({ error: "Failed to update user" });
  }
});

// DELETE /api/admin/users/:userId — delete a user and their memberships
router.delete("/users/:userId", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    await AccountMembership.deleteMany({ userId: user._id });
    await User.deleteOne({ _id: user._id });

    res.json({ message: "User deleted" });
  } catch (err) {
    console.error("Error deleting user:", err);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

// GET /api/admin/users/:userId/memberships
router.get(
  "/users/:userId/memberships",
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const memberships = await AccountMembership.find({ userId }).lean();
      res.json(
        memberships.map((m) => ({
          id: m._id,
          accountId: m.accountId,
          role: m.role,
        })),
      );
    } catch (err) {
      console.error("Error fetching memberships:", err);
      res.status(500).json({ error: "Failed to fetch memberships" });
    }
  },
);

// POST /api/admin/users/:userId/memberships — add user to account
router.post(
  "/users/:userId/memberships",
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { accountId, role } = req.body;

      if (!accountId) {
        return res.status(400).json({ error: "accountId is required" });
      }

      const existing = await AccountMembership.findOne({ userId, accountId });
      if (existing) {
        return res
          .status(409)
          .json({ error: "User is already assigned to this account" });
      }

      const membership = await AccountMembership.create({
        userId,
        accountId,
        role: role || "owner",
      });

      res.status(201).json({
        id: membership._id,
        accountId: membership.accountId,
        role: membership.role,
      });
    } catch (err) {
      console.error("Error adding membership:", err);
      res.status(500).json({ error: "Failed to add membership" });
    }
  },
);

// DELETE /api/admin/users/:userId/memberships/:membershipId
router.delete(
  "/users/:userId/memberships/:membershipId",
  async (req: Request, res: Response) => {
    try {
      const { membershipId } = req.params;
      const result = await AccountMembership.deleteOne({ _id: membershipId });
      if (result.deletedCount === 0) {
        return res.status(404).json({ error: "Membership not found" });
      }
      res.json({ message: "Membership removed" });
    } catch (err) {
      console.error("Error removing membership:", err);
      res.status(500).json({ error: "Failed to remove membership" });
    }
  },
);

export default router;
