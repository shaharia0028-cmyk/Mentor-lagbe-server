import { MongoClient } from "mongodb";
import { env } from "./env.js";

// The driver connects lazily on the first operation, so no manual connect() is needed.
export const client = new MongoClient(env.mongoUri);
export const db = client.db(env.dbName);

// The 4 application collections. BetterAuth manages "users" through its adapter.
export const users = db.collection("users");
export const tuitions = db.collection("tuitions");
export const applications = db.collection("applications");
export const payments = db.collection("payments");

export async function ensureIndexes() {
  await Promise.all([
    tuitions.createIndex({ approvalStatus: 1, isActive: 1, createdAt: -1 }),
    tuitions.createIndex({ tutorEmail: 1 }),
    applications.createIndex({ tuitionId: 1, studentEmail: 1 }, { unique: true }),
    applications.createIndex({ tutorEmail: 1 }),
    applications.createIndex({ studentEmail: 1 }),
    payments.createIndex({ stripeSessionId: 1 }, { unique: true }),
  ]);
}
