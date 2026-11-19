import { Router } from "express";
import { payments, users } from "../config/db.js";
import { env, primaryClientUrl } from "../config/env.js";
import { PRO_PLANS } from "../config/plans.js";
import { getStripe } from "../lib/stripe.js";
import { verifyAdmin, verifyToken } from "../middlewares/auth.js";
import { HttpError } from "../utils/helpers.js";

const router = Router();

// Saves a paid Checkout Session once. Safe to call many times for the same session
// (the webhook and the success page can both call it).
async function fulfillSession(session) {
  if (session.payment_status !== "paid" || !session.metadata?.userEmail) {
    return false;
  }

  const { userEmail, userName, userRole, planName } = session.metadata;

  await payments.updateOne(
    { stripeSessionId: session.id },
    {
      $setOnInsert: {
        userEmail,
        userName,
        userRole,
        planName,
        amount: session.amount_total / 100,
        currency: session.currency,
        transactionId: session.payment_intent,
        stripeSessionId: session.id,
        paymentStatus: "paid",
        paidAt: new Date(),
      },
    },
    { upsert: true },
  );
  await users.updateOne({ email: userEmail }, { $set: { plan: "pro", updatedAt: new Date() } });

  return true;
}

// Stripe calls this endpoint. app.js mounts it with the raw body before express.json().
export async function stripeWebhook(req, res) {
  let event;
  try {
    event = getStripe().webhooks.constructEvent(
      req.body,
      req.headers["stripe-signature"],
      env.stripeWebhookSecret,
    );
  } catch (error) {
    return res.status(400).send(`Webhook error: ${error.message}`);
  }

  if (["checkout.session.completed", "checkout.session.async_payment_succeeded"].includes(event.type)) {
    const session = await getStripe().checkout.sessions.retrieve(event.data.object.id);
    await fulfillSession(session);
  }

  res.json({ received: true });
}

router.post("/checkout", verifyToken, async (req, res) => {
  const plan = PRO_PLANS[req.user.role];
  if (!plan) throw new HttpError(403, "Only students and tutors can buy the Pro plan");
  if (req.user.plan === "pro") throw new HttpError(409, "You are already on the Pro plan");

  const session = await getStripe().checkout.sessions.create({
    mode: "payment",
    customer_email: req.user.email,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: plan.amount * 100,
          product_data: { name: `MentorLagbe ${plan.name}` },
        },
      },
    ],
    metadata: {
      userEmail: req.user.email,
      userName: req.user.name,
      userRole: req.user.role,
      planName: plan.name,
    },
    success_url: `${primaryClientUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${primaryClientUrl}/payment/cancel`,
  });

  res.json({ url: session.url });
});

// Called by /payment/success so the plan is upgraded even if the webhook is slow.
router.get("/verify", verifyToken, async (req, res) => {
  const sessionId = String(req.query.session_id || "");
  if (!sessionId.startsWith("cs_")) throw new HttpError(400, "A valid session_id is required");

  const session = await getStripe().checkout.sessions.retrieve(sessionId);
  if (session.metadata?.userEmail !== req.user.email) {
    throw new HttpError(403, "This payment belongs to another account");
  }

  const paid = await fulfillSession(session);

  res.json({
    paid,
    planName: session.metadata.planName,
    amount: session.amount_total / 100,
    transactionId: session.payment_intent,
  });
});

// Admin: all transactions.
router.get("/", verifyToken, verifyAdmin, async (req, res) => {
  const data = await payments.find().sort({ paidAt: -1 }).toArray();
  res.json(data);
});

export default router;
