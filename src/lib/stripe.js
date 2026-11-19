import Stripe from "stripe";
import { env } from "../config/env.js";
import { HttpError } from "../utils/helpers.js";

let stripeClient;

export function getStripe() {
  if (!env.stripeSecretKey) {
    throw new HttpError(500, "Stripe is not configured on the server");
  }
  stripeClient ??= new Stripe(env.stripeSecretKey);
  return stripeClient;
}
