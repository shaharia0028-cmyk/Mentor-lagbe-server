import { Router } from "express";
import { env } from "../config/env.js";
import { verifyToken } from "../middlewares/auth.js";
import { HttpError } from "../utils/helpers.js";

const router = Router();

const MAX_IMAGE_BYTES = 3 * 1024 * 1024;

// The browser sends the image as base64 so the ImgBB key never reaches the frontend.
router.post("/image", verifyToken, async (req, res) => {
  if (!env.imgbbKey) throw new HttpError(500, "Image upload is not configured on the server");

  const image = typeof req.body.image === "string" ? req.body.image.replace(/^data:image\/\w+;base64,/, "") : "";
  if (!image) throw new HttpError(400, "Image data is required");
  if (Buffer.byteLength(image, "base64") > MAX_IMAGE_BYTES) {
    throw new HttpError(413, "Image must be 3 MB or smaller");
  }

  const form = new FormData();
  form.append("image", image);

  const response = await fetch(`https://api.imgbb.com/1/upload?key=${env.imgbbKey}`, {
    method: "POST",
    body: form,
  });
  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new HttpError(502, "Image upload failed. Please try again.");
  }

  res.status(201).json({ url: result.data.url, deleteUrl: result.data.delete_url });
});

export default router;
