import { Router } from "express";
import { tuitions, users } from "../config/db.js";
import { FREE_LIMITS } from "../config/plans.js";
import { verifyStudent, verifyToken } from "../middlewares/auth.js";
import { HttpError, toObjectId } from "../utils/helpers.js";

const router = Router();

router.use(verifyToken, verifyStudent);

// Saved tuition ids live on the user document, which keeps the database at 4 collections.
async function getSavedIds(email) {
  const user = await users.findOne({ email }, { projection: { savedTuitions: 1 } });
  return user?.savedTuitions ?? [];
}

// Only ids, used to show the filled bookmark icon on cards.
router.get("/ids", async (req, res) => {
  const ids = await getSavedIds(req.user.email);
  res.json(ids.map(String));
});

router.get("/", async (req, res) => {
  const ids = await getSavedIds(req.user.email);
  const data = await tuitions
    .find({ _id: { $in: ids }, approvalStatus: "approved" })
    .sort({ createdAt: -1 })
    .toArray();
  res.json(data);
});

// Adds the bookmark, or removes it if it already exists.
router.post("/:tuitionId", async (req, res) => {
  const tuitionId = toObjectId(req.params.tuitionId);
  const tuition = tuitionId && (await tuitions.findOne({ _id: tuitionId, approvalStatus: "approved" }));
  if (!tuition) throw new HttpError(404, "Tuition not found");

  const ids = await getSavedIds(req.user.email);
  const isSaved = ids.some((id) => id.equals(tuitionId));

  if (isSaved) {
    await users.updateOne({ email: req.user.email }, { $pull: { savedTuitions: tuitionId } });
    return res.json({ saved: false, message: "Removed from saved tuitions" });
  }

  if (req.user.plan !== "pro" && ids.length >= FREE_LIMITS.studentBookmarks) {
    throw new HttpError(403, `Free plan allows ${FREE_LIMITS.studentBookmarks} saved tuitions. Upgrade to Pro for unlimited bookmarks.`, {
      code: "PLAN_LIMIT",
    });
  }

  await users.updateOne({ email: req.user.email }, { $addToSet: { savedTuitions: tuitionId } });
  res.json({ saved: true, message: "Saved to your tuitions" });
});

export default router;
