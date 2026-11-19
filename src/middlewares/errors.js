import { env } from "../config/env.js";
import { HttpError } from "../utils/helpers.js";

export function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

// Express 5 forwards errors from async handlers here automatically.
export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);

  if (error instanceof HttpError) {
    return res.status(error.status).json({ message: error.message, ...error.details });
  }

  if (error.code === 11000) {
    return res.status(409).json({ message: "This record already exists" });
  }

  console.error(error);
  res.status(500).json({ message: env.isProd ? "Something went wrong" : error.message });
}
