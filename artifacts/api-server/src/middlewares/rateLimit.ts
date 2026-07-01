import { Request, Response, NextFunction } from "express";

interface WindowEntry {
  count: number;
  windowStart: number;
}

const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 60;

const ipWindows = new Map<string, WindowEntry>();

function pruneOldWindows(): void {
  const now = Date.now();
  for (const [ip, entry] of ipWindows.entries()) {
    if (now - entry.windowStart > WINDOW_MS * 2) {
      ipWindows.delete(ip);
    }
  }
}

export function rateLimit(req: Request, res: Response, next: NextFunction): void {
  pruneOldWindows();

  const ip =
    (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() ??
    req.socket.remoteAddress ??
    "unknown";

  const now = Date.now();
  const entry = ipWindows.get(ip);

  if (!entry || now - entry.windowStart > WINDOW_MS) {
    ipWindows.set(ip, { count: 1, windowStart: now });
    next();
    return;
  }

  entry.count += 1;

  if (entry.count > MAX_REQUESTS) {
    res.status(429).json({
      error: "Too many requests",
      retryAfter: Math.ceil((entry.windowStart + WINDOW_MS - now) / 1000),
    });
    return;
  }

  next();
}
