import { Router } from "express";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import * as db from "./db";
import { SignJWT } from "jose";

export const devRouter = Router();

async function signDevSession(openId: string, name: string): Promise<string> {
  // Use JWT_SECRET from env or a hardcoded fallback for dev
  const secret = process.env.JWT_SECRET || "dev-secret-key-at-least-32-chars-long-for-security";
  const secretKey = new TextEncoder().encode(secret);
  const appId = process.env.VITE_APP_ID || "dev-app-id";

  const expiresAt = Math.floor((Date.now() + ONE_YEAR_MS) / 1000);

  return new SignJWT({ openId, appId, name })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setExpirationTime(expiresAt)
    .sign(secretKey);
}

devRouter.post("/login", async (req, res) => {
  const { role } = req.body;

  if (role !== "admin" && role !== "user") {
    res.status(400).json({ error: "Role must be 'admin' or 'user'" });
    return;
  }

  const openId = role === "admin" ? "dev-admin-openid" : "dev-user-openid";
  const name = role === "admin" ? "Dev Admin" : "Dev User";
  const email = role === "admin" ? "admin@dev.local" : "user@dev.local";

  try {
    // Upsert user in DB
    await db.upsertUser({
      openId,
      name,
      email,
      loginMethod: "dev",
      role: role,
      lastSignedIn: new Date(),
    });

    // Create session JWT directly (no dependency on external OAuth SDK)
    const sessionToken = await signDevSession(openId, name);

    const cookieOptions = getSessionCookieOptions(req);
    res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

    res.json({ success: true });
  } catch (error) {
    console.error("[DevLogin] Error:", error);
    res.status(500).json({ error: "Failed to create dev session", details: String(error) });
  }
});
