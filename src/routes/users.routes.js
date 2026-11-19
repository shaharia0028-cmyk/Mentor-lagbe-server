import { Router } from "express";
import { users } from "../config/db.js";
import { verifyToken } from "../middlewares/auth.js";
import { parseProfile } from "../utils/validators.js";

const router = Router();

const PROFILE_FIELDS = { name: 1, email: 1, image: 1, role: 1, plan: 1, phone: 1, bio: 1, createdAt: 1 };

router.get("/me", verifyToken, async (req, res) => {
  const user = await users.findOne({ email: req.user.email }, { projection: PROFILE_FIELDS });
  res.json(user);
});

// Name, phone, bio and profile image. Role and plan can never be changed here.
router.patch("/me", verifyToken, async (req, res) => {
  const value = parseProfile(req.body);

  await users.updateOne({ email: req.user.email }, { $set: { ...value, updatedAt: new Date() } });

  const user = await users.findOne({ email: req.user.email }, { projection: PROFILE_FIELDS });
  res.json({ message: "Profile updated", user });
});

export default router;
