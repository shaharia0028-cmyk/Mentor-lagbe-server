import cors from "cors";
import express from "express";
import { toNodeHandler } from "better-auth/node";
import { ensureIndexes } from "./config/db.js";
import { env } from "./config/env.js";
import { auth } from "./lib/auth.js";
import { errorHandler, notFound } from "./middlewares/errors.js";
import { stripeWebhook } from "./routes/payments.routes.js";
import routes from "./routes/index.js";

const app = express();

app.set("trust proxy", 1);

app.use(
  cors({
    origin: env.clientUrls,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Stripe needs the raw body to verify its signature, so this comes before express.json().
app.post("/api/payments/webhook", express.raw({ type: "application/json" }), stripeWebhook);

// BetterAuth must also be mounted before express.json().
app.all("/api/auth/*splat", toNodeHandler(auth));

app.use(express.json({ limit: "6mb" }));

app.get("/", (req, res) => {
  res.json({ name: "MentorLagbe API", status: "running" });
});

app.use("/api", routes);

app.use(notFound);
app.use(errorHandler);

ensureIndexes().catch((error) => console.error("Could not create indexes:", error.message));

export default app;
