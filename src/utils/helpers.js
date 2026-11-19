import { ObjectId } from "mongodb";

export class HttpError extends Error {
  constructor(status, message, details = {}) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export const toObjectId = (id) => (ObjectId.isValid(id) ? new ObjectId(id) : null);

export const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Reads a positive integer from a query string value.
export const toPositiveInt = (value, fallback) => {
  const number = parseInt(value, 10);
  return Number.isNaN(number) || number < 1 ? fallback : number;
};
