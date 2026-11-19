import { Router } from "express";
import { tuitions, users } from "../config/db.js";
import { verifyAdmin, verifyToken } from "../middlewares/auth.js";
import { HttpError, escapeRegex, toObjectId } from "../utils/helpers.js";

const router = Router();

router.use(verifyToken, verifyAdmin);

const ROLES = ["student", "tutor", "admin"];
const APPROVAL_STATUSES = ["pending", "approved", "rejected"];

// ---------- Users ----------

router.get("/users", async (req, res) => {
  const filter = {};

  const role = String(req.query.role || "");
  if (ROLES.includes(role)) filter.role = role;

  const search = String(req.query.search || "").trim();
  if (search) {
    const pattern = new RegExp(escapeRegex(search), "i");
    filter.$or = [{ name: pattern }, { email: pattern }];
  }

  const data = await users
    .find(filter, { projection: { savedTuitions: 0 } })
    .sort({ createdAt: -1 })
    .toArray();
  res.json(data);
});

router.patch("/users/:id/role", async (req, res) => {
  const { role } = req.body;
  if (!ROLES.includes(role)) throw new HttpError(400, "Role must be student, tutor or admin");

  const _id = toObjectId(req.params.id);
  if (_id && _id.toString() === req.user.id) {
    throw new HttpError(400, "You cannot change your own role");
  }

  const result = await users.updateOne({ _id }, { $set: { role, updatedAt: new Date() } });
  if (!result.matchedCount) throw new HttpError(404, "User not found");

  res.json({ message: `Role changed to ${role}` });
});

// ---------- Tuition moderation ----------

router.get("/tuitions", async (req, res) => {
  const status = String(req.query.status || "all");
  const filter = APPROVAL_STATUSES.includes(status) ? { approvalStatus: status } : {};

  const [data, grouped] = await Promise.all([
    tuitions.find(filter).sort({ createdAt: -1 }).toArray(),
    tuitions.aggregate([{ $group: { _id: "$approvalStatus", total: { $sum: 1 } } }]).toArray(),
  ]);

  // Counts for the tab badges: pending, approved, rejected and all.
  const counts = { pending: 0, approved: 0, rejected: 0, all: 0 };
  for (const item of grouped) {
    counts[item._id] = item.total;
    counts.all += item.total;
  }

  res.json({ data, counts });
});

router.patch("/tuitions/:id/approval", async (req, res) => {
  const { status } = req.body;
  if (!APPROVAL_STATUSES.includes(status)) {
    throw new HttpError(400, "Status must be pending, approved or rejected");
  }

  const result = await tuitions.updateOne(
    { _id: toObjectId(req.params.id) },
    { $set: { approvalStatus: status, reviewedAt: new Date() } },
  );
  if (!result.matchedCount) throw new HttpError(404, "Tuition not found");

  res.json({ message: `Tuition ${status}` });
});

export default router;
