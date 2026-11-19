import { Router } from "express";
import { applications, payments, tuitions, users } from "../config/db.js";
import { verifyAdmin, verifyStudent, verifyToken, verifyTutor } from "../middlewares/auth.js";

const router = Router();

// Home page counters.
router.get("/public", async (req, res) => {
  const [tutors, students, activeTuitions, subjects] = await Promise.all([
    users.countDocuments({ role: "tutor" }),
    users.countDocuments({ role: "student" }),
    tuitions.countDocuments({ approvalStatus: "approved", isActive: true }),
    tuitions.distinct("subject", { approvalStatus: "approved", isActive: true }),
  ]);

  res.json({ tutors, students, activeTuitions, subjects: subjects.length });
});

router.get("/student", verifyToken, verifyStudent, async (req, res) => {
  const owner = { studentEmail: req.user.email };
  const [totalApplied, accepted, pending] = await Promise.all([
    applications.countDocuments(owner),
    applications.countDocuments({ ...owner, status: "accepted" }),
    applications.countDocuments({ ...owner, status: "pending" }),
  ]);

  res.json({ totalApplied, accepted, pending, plan: req.user.plan });
});

router.get("/tutor", verifyToken, verifyTutor, async (req, res) => {
  const owner = { tutorEmail: req.user.email };
  const [totalPosted, activeApproved, totalApplicants] = await Promise.all([
    tuitions.countDocuments(owner),
    tuitions.countDocuments({ ...owner, approvalStatus: "approved", isActive: true }),
    applications.countDocuments(owner),
  ]);

  res.json({ totalPosted, activeApproved, totalApplicants, plan: req.user.plan });
});

router.get("/admin", verifyToken, verifyAdmin, async (req, res) => {
  const [totalUsers, totalTutors, totalStudents, pendingTuitions, approvedTuitions, revenue] = await Promise.all([
    users.countDocuments(),
    users.countDocuments({ role: "tutor" }),
    users.countDocuments({ role: "student" }),
    tuitions.countDocuments({ approvalStatus: "pending" }),
    tuitions.countDocuments({ approvalStatus: "approved" }),
    payments.aggregate([{ $group: { _id: null, total: { $sum: "$amount" } } }]).toArray(),
  ]);

  res.json({
    totalUsers,
    totalTutors,
    totalStudents,
    pendingTuitions,
    approvedTuitions,
    totalRevenue: revenue[0]?.total ?? 0,
  });
});

export default router;
