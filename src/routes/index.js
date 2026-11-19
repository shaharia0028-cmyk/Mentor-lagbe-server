import { Router } from "express";
import adminRoutes from "./admin.routes.js";
import applicationRoutes from "./applications.routes.js";
import bookmarkRoutes from "./bookmarks.routes.js";
import paymentRoutes from "./payments.routes.js";
import statsRoutes from "./stats.routes.js";
import tuitionRoutes from "./tuitions.routes.js";
import uploadRoutes from "./uploads.routes.js";
import userRoutes from "./users.routes.js";

const router = Router();

router.use("/tuitions", tuitionRoutes);
router.use("/applications", applicationRoutes);
router.use("/bookmarks", bookmarkRoutes);
router.use("/users", userRoutes);
router.use("/uploads", uploadRoutes);
router.use("/admin", adminRoutes);
router.use("/payments", paymentRoutes);
router.use("/stats", statsRoutes);

export default router;
