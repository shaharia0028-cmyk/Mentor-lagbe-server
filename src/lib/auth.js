import { betterAuth } from "better-auth";
import { jwt } from "better-auth/plugins";
import { mongodbAdapter } from "@better-auth/mongo-adapter";
import { db } from "../config/db.js";
import { env } from "../config/env.js";

export const auth = betterAuth({
  appName: "MentorLagbe",
  baseURL: env.authUrl,
  secret: env.authSecret,
  trustedOrigins: env.clientUrls,

  // BetterAuth stores its own data (users, account, session, ...) through this adapter.
  database: mongodbAdapter(db),

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },

  user: {
    // Store users in the "users" collection required by the assignment.
    modelName: "users",
    additionalFields: {
      role: { type: "string", required: false, defaultValue: "student", input: true },
      plan: { type: "string", required: false, defaultValue: "free", input: false },
      phone: { type: "string", required: false, input: false },
      bio: { type: "string", required: false, input: false },
    },
  },

  databaseHooks: {
    user: {
      create: {
        // Only "student" or "tutor" can be chosen at sign up. Admins are created by the seed script.
        before: async (user) => ({
          data: {
            ...user,
            role: user.role === "tutor" ? "tutor" : "student",
            plan: "free",
          },
        }),
      },
    },
  },

  // Profile edits go through our own PATCH /api/users/me, so users can never change role or plan themselves.
  disabledPaths: ["/update-user"],

  plugins: [
    jwt({
      jwt: {
        expirationTime: "1h",
        definePayload: ({ user }) => ({
          id: user.id,
          email: user.email,
          role: user.role,
        }),
      },
    }),
  ],

  advanced: {
    // Needed when the frontend and backend live on different domains in production.
    defaultCookieAttributes: env.isProd ? { sameSite: "none", secure: true } : {},
  },
});
