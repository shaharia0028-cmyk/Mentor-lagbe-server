import { HttpError } from "./helpers.js";

const MODES = ["Online", "Offline"];
const urlPattern = /^https?:\/\/\S+$/i;
const phonePattern = /^\+?[0-9\s-]{7,16}$/;

const text = (value) => (typeof value === "string" ? value.trim() : "");

function fail(errors) {
  throw new HttpError(400, "Validation failed", { errors });
}

export function parseTuition(body = {}) {
  const errors = {};
  const mode = text(body.mode);
  const monthlyFee = Number(body.monthlyFee);
  const daysPerWeek = Number(body.daysPerWeek);

  const value = {
    title: text(body.title),
    subject: text(body.subject),
    classLevel: text(body.classLevel),
    mode,
    location: mode === "Online" ? "Online" : text(body.location),
    monthlyFee,
    daysPerWeek,
    bannerImage: text(body.bannerImage),
    description: text(body.description),
  };

  if (value.title.length < 5) errors.title = "Title must be at least 5 characters";
  if (!value.subject) errors.subject = "Subject is required";
  if (!value.classLevel) errors.classLevel = "Class level is required";
  if (!MODES.includes(mode)) errors.mode = "Mode must be Online or Offline";
  if (!value.location) errors.location = "Location is required for offline tuition";
  if (!Number.isFinite(monthlyFee) || monthlyFee <= 0) errors.monthlyFee = "Monthly fee must be a positive number";
  if (!Number.isInteger(daysPerWeek) || daysPerWeek < 1 || daysPerWeek > 7) {
    errors.daysPerWeek = "Days per week must be between 1 and 7";
  }
  if (value.description.length < 20) errors.description = "Description must be at least 20 characters";
  if (value.bannerImage && !urlPattern.test(value.bannerImage)) errors.bannerImage = "Banner must be a valid image URL";

  if (Object.keys(errors).length > 0) fail(errors);
  return value;
}

export function parseApplication(body = {}) {
  const errors = {};
  const value = {
    studentPhone: text(body.studentPhone),
    preferredSchedule: text(body.preferredSchedule) || "Flexible / Discuss with Tutor",
    studentNote: text(body.studentNote).slice(0, 500),
  };

  if (!phonePattern.test(value.studentPhone)) errors.studentPhone = "Enter a valid phone number";
  if (value.preferredSchedule.length > 80) errors.preferredSchedule = "Schedule is too long";

  if (Object.keys(errors).length > 0) fail(errors);
  return value;
}

export function parseProfile(body = {}) {
  const errors = {};
  const value = {
    name: text(body.name),
    phone: text(body.phone),
    bio: text(body.bio),
    image: text(body.image),
  };

  if (value.name.length < 2 || value.name.length > 60) errors.name = "Name must be 2 to 60 characters";
  if (value.phone && !phonePattern.test(value.phone)) errors.phone = "Enter a valid phone number";
  if (value.bio.length > 300) errors.bio = "Bio must be 300 characters or fewer";
  if (value.image && !urlPattern.test(value.image)) errors.image = "Image must be a valid URL";

  if (Object.keys(errors).length > 0) fail(errors);
  return value;
}
