import { createPublicKey, verify } from "crypto";
import { Request, Response, NextFunction } from "express";

const ED25519_SPKI_PREFIX = Buffer.from("302a300506032b6570032100", "hex");

function getPublicKey() {
  const hex = process.env["DISCORD_PUBLIC_KEY"];
  if (!hex) return null;
  const rawKey = Buffer.from(hex, "hex");
  const spki = Buffer.concat([ED25519_SPKI_PREFIX, rawKey]);
  return createPublicKey({ key: spki, format: "der", type: "spki" });
}

export function discordWebhookAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const publicKey = getPublicKey();

  if (!publicKey) {
    req.log.warn("DISCORD_PUBLIC_KEY not set — skipping signature verification (development mode)");
    next();
    return;
  }

  const signature = req.headers["x-signature-ed25519"] as string | undefined;
  const timestamp = req.headers["x-signature-timestamp"] as string | undefined;

  if (!signature || !timestamp) {
    res.status(401).json({ error: "Missing signature headers" });
    return;
  }

  const body = (req as Request & { rawBody?: Buffer }).rawBody;
  if (!body) {
    res.status(400).json({ error: "Missing request body" });
    return;
  }

  const message = Buffer.concat([Buffer.from(timestamp), body]);
  const signatureBuffer = Buffer.from(signature, "hex");

  let valid = false;
  try {
    valid = verify(null, message, publicKey, signatureBuffer);
  } catch {
    valid = false;
  }

  if (!valid) {
    res.status(401).json({ error: "Invalid request signature" });
    return;
  }

  next();
}
