import "dotenv/config";

const required = ["MONGODB_URI", "BETTER_AUTH_SECRET", "BETTER_AUTH_URL", "CLIENT_URL"];
const missing = required.filter((key) => !process.env[key]);

if (missing.length > 0) {
  throw new Error(`Missing environment variables: ${missing.join(", ")}`);
}

const trimSlash = (url) => url.replace(/\/+$/, "");

export const env = {
  port: Number(process.env.PORT) || 5000,
  isProd: process.env.NODE_ENV === "production",
  mongoUri: process.env.MONGODB_URI,
  dbName: process.env.DB_NAME || "mentorlagbe",
  authSecret: process.env.BETTER_AUTH_SECRET,
  authUrl: trimSlash(process.env.BETTER_AUTH_URL),
  clientUrls: process.env.CLIENT_URL.split(",").map((url) => trimSlash(url.trim())),
  stripeSecretKey: process.env.STRIPE_SECRET_KEY,
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  imgbbKey: process.env.IMGBB_API_KEY,
};

// The first origin is used for Stripe redirect URLs.
export const primaryClientUrl = env.clientUrls[0];
