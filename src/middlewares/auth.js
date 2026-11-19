import { createLocalJWKSet, jwtVerify } from "jose";
import { auth } from "../lib/auth.js";
import { users } from "../config/db.js";

let keySet;

// Public keys come from BetterAuth's JWT plugin and are cached after the first load.
async function getKeySet(forceRefresh = false) {
  if (!keySet || forceRefresh) {
    const jwks = await auth.api.getJwks();
    keySet = createLocalJWKSet(jwks);
  }
  return keySet;
}

async function readPayload(token) {
  try {
    const { payload } = await jwtVerify(token, await getKeySet());
    return payload;
  } catch (error) {
    // A new signing key may have been created, so refresh the keys once and retry.
    if (error.code !== "ERR_JWKS_NO_MATCHING_KEY") throw error;
    const { payload } = await jwtVerify(token, await getKeySet(true));
    return payload;
  }
}

export async function verifyToken(req, res, next) {
  const [scheme, token] = (req.headers.authorization || "").split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ message: "Authorization token is missing" });
  }

  try {
    const payload = await readPayload(token);

    // The role always comes from the database, never from the token alone.
    const user = await users.findOne({ email: payload.email });
    if (!user) {
      return res.status(401).json({ message: "User no longer exists" });
    }

    req.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      image: user.image,
      role: user.role,
      plan: user.plan,
    };
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
  }
}

const requireRole = (role) => (req, res, next) => {
  if (req.user?.role !== role) {
    return res.status(403).json({ message: `Only ${role}s can access this resource` });
  }
  next();
};

export const verifyStudent = requireRole("student");
export const verifyTutor = requireRole("tutor");
export const verifyAdmin = requireRole("admin");
