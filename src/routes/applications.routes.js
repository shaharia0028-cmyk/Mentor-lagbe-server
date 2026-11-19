import { Router } from "express";
import { applications, tuitions } from "../config/db.js";
import { verifyStudent, verifyToken, verifyTutor } from "../middlewares/auth.js";
import { HttpError, toObjectId } from "../utils/helpers.js";
import { parseApplication } from "../utils/validators.js";

const router = Router();

// ---------- Student ----------

router.post("/", verifyToken, verifyStudent, async (req, res) => {
  const tuitionId = toObjectId(req.body.tuitionId);
  const tuition = tuitionId && (await tuitions.findOne({ _id: tuitionId, approvalStatus: "approved" }));
  if (!tuition) throw new HttpError(404, "Tuition not found");
  if (!tuition.isActive) throw new HttpError(409, "This tuition is closed for new applications");

  const alreadyApplied = await applications.findOne({ tuitionId, studentEmail: req.user.email });
  if (alreadyApplied) throw new HttpError(409, "You have already applied for this tuition");

  const value = parseApplication(req.body);

  await applications.insertOne({
    tuitionId,
    tuitionTitle: tuition.title,
    subject: tuition.subject,
    monthlyFee: tuition.monthlyFee,
    tutorEmail: tuition.tutorEmail,
    studentName: req.user.name,
    studentEmail: req.user.email,
    ...value,
    // Pro students get priority booking: their applications are listed first for the tutor.
    isPriority: req.user.plan === "pro",
    status: "pending",
    appliedAt: new Date(),
  });

  res.status(201).json({ message: "Application submitted" });
});

router.get("/mine", verifyToken, verifyStudent, async (req, res) => {
  const data = await applications.find({ studentEmail: req.user.email }).sort({ appliedAt: -1 }).toArray();
  res.json(data);
});

// A student can cancel only while the application is still pending.
router.delete("/:id", verifyToken, verifyStudent, async (req, res) => {
  const _id = toObjectId(req.params.id);
  const application = await applications.findOne({ _id, studentEmail: req.user.email });
  if (!application) throw new HttpError(404, "Application not found");
  if (application.status !== "pending") {
    throw new HttpError(409, "Only pending applications can be cancelled");
  }

  await applications.deleteOne({ _id });
  res.json({ message: "Application cancelled" });
});

// ---------- Tutor ----------

router.get("/received", verifyToken, verifyTutor, async (req, res) => {
  const data = await applications
    .find({ tutorEmail: req.user.email })
    .sort({ isPriority: -1, appliedAt: -1 })
    .toArray();
  res.json(data);
});

router.patch("/:id/status", verifyToken, verifyTutor, async (req, res) => {
  const { status } = req.body;
  if (!["accepted", "rejected"].includes(status)) {
    throw new HttpError(400, "Status must be accepted or rejected");
  }

  const _id = toObjectId(req.params.id);
  const application = await applications.findOne({ _id, tutorEmail: req.user.email });
  if (!application) throw new HttpError(404, "Application not found");
  if (application.status !== "pending") throw new HttpError(409, "This application has already been answered");

  await applications.updateOne({ _id }, { $set: { status, respondedAt: new Date() } });
  res.json({ message: `Application ${status}` });
});

export default router;
