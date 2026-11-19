import { Router } from "express";
import { applications, tuitions, users } from "../config/db.js";
import { FREE_LIMITS } from "../config/plans.js";
import { verifyToken, verifyTutor } from "../middlewares/auth.js";
import { HttpError, escapeRegex, toObjectId, toPositiveInt } from "../utils/helpers.js";
import { parseTuition } from "../utils/validators.js";

const router = Router();

const PUBLIC_FILTER = { approvalStatus: "approved", isActive: true };
const MODES = ["Online", "Offline"];

// ---------- Public ----------

// Browse page: server-side search, filters and pagination.
router.get("/", async (req, res) => {
  const page = toPositiveInt(req.query.page, 1);
  const limit = Math.min(toPositiveInt(req.query.limit, 9), 24);
  const filter = { ...PUBLIC_FILTER };

  const search = String(req.query.search || "").trim();
  if (search) {
    const pattern = new RegExp(escapeRegex(search), "i");
    filter.$or = [{ title: pattern }, { subject: pattern }, { tutorName: pattern }];
  }

  for (const key of ["subject", "classLevel"]) {
    const value = String(req.query[key] || "").trim();
    if (value && value !== "all") filter[key] = value;
  }

  const mode = String(req.query.mode || "").trim();
  if (MODES.includes(mode)) filter.mode = mode;

  const [data, total] = await Promise.all([
    tuitions
      .find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray(),
    tuitions.countDocuments(filter),
  ]);

  res.json({ data, total, page, limit, pages: Math.ceil(total / limit) });
});

// Home page: 6 latest approved and active tuitions.
router.get("/latest", async (req, res) => {
  const data = await tuitions.find(PUBLIC_FILTER).sort({ createdAt: -1 }).limit(6).toArray();
  res.json(data);
});

// Values for the filter dropdowns.
router.get("/filters", async (req, res) => {
  const [subjects, classLevels] = await Promise.all([
    tuitions.distinct("subject", PUBLIC_FILTER),
    tuitions.distinct("classLevel", PUBLIC_FILTER),
  ]);
  res.json({ subjects: subjects.sort(), classLevels: classLevels.sort(), modes: MODES });
});

// ---------- Tutor ----------

router.get("/mine", verifyToken, verifyTutor, async (req, res) => {
  const data = await tuitions.find({ tutorEmail: req.user.email }).sort({ createdAt: -1 }).toArray();

  const counts = await applications
    .aggregate([
      { $match: { tutorEmail: req.user.email } },
      { $group: { _id: "$tuitionId", total: { $sum: 1 } } },
    ])
    .toArray();
  const countById = new Map(counts.map((item) => [item._id.toString(), item.total]));

  res.json(data.map((tuition) => ({ ...tuition, applicantCount: countById.get(tuition._id.toString()) || 0 })));
});

router.post("/", verifyToken, verifyTutor, async (req, res) => {
  const value = parseTuition(req.body);

  if (req.user.plan !== "pro") {
    const posted = await tuitions.countDocuments({ tutorEmail: req.user.email });
    if (posted >= FREE_LIMITS.tutorTuitions) {
      throw new HttpError(403, `Free plan allows ${FREE_LIMITS.tutorTuitions} tuition posts. Upgrade to Pro for unlimited posts.`, {
        code: "PLAN_LIMIT",
      });
    }
  }

  const tuition = {
    ...value,
    tutorName: req.user.name,
    tutorEmail: req.user.email,
    approvalStatus: "pending",
    isActive: true,
    createdAt: new Date(),
  };
  const { insertedId } = await tuitions.insertOne(tuition);

  res.status(201).json({ message: "Tuition submitted for admin approval", _id: insertedId });
});

router.patch("/:id", verifyToken, verifyTutor, async (req, res) => {
  const _id = toObjectId(req.params.id);
  const value = parseTuition(req.body);

  const result = await tuitions.updateOne(
    { _id, tutorEmail: req.user.email },
    { $set: { ...value, updatedAt: new Date() } },
  );
  if (!result.matchedCount) throw new HttpError(404, "Tuition not found");

  res.json({ message: "Tuition updated" });
});

// Toggle Active / Closed.
router.patch("/:id/status", verifyToken, verifyTutor, async (req, res) => {
  const _id = toObjectId(req.params.id);
  const tuition = await tuitions.findOne({ _id, tutorEmail: req.user.email });
  if (!tuition) throw new HttpError(404, "Tuition not found");

  const isActive = !tuition.isActive;
  await tuitions.updateOne({ _id }, { $set: { isActive } });

  res.json({ message: isActive ? "Tuition is now active" : "Tuition is now closed", isActive });
});

router.delete("/:id", verifyToken, verifyTutor, async (req, res) => {
  const _id = toObjectId(req.params.id);
  const result = await tuitions.deleteOne({ _id, tutorEmail: req.user.email });
  if (!result.deletedCount) throw new HttpError(404, "Tuition not found");

  await applications.deleteMany({ tuitionId: _id });
  res.json({ message: "Tuition deleted" });
});

// ---------- Public details (keep last so it does not catch the paths above) ----------

router.get("/:id", async (req, res) => {
  const _id = toObjectId(req.params.id);
  const tuition = _id && (await tuitions.findOne({ _id, approvalStatus: "approved" }));
  if (!tuition) throw new HttpError(404, "Tuition not found");

  const tutor = await users.findOne(
    { email: tuition.tutorEmail },
    { projection: { name: 1, email: 1, image: 1, bio: 1, plan: 1 } },
  );

  res.json({ ...tuition, tutor });
});

export default router;
