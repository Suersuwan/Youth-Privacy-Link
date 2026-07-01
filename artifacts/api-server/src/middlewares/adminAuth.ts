import { Request, Response, NextFunction } from "express";

export function adminAuth(req: Request, res: Response, next: NextFunction): void {
  const apiKey = process.env["ADMIN_API_KEY"];

  if (!apiKey) {
    req.log.error("ADMIN_API_KEY env var is not set — admin endpoints are disabled");
    res.status(503).json({ error: "Admin endpoints are not configured" });
    return;
  }

  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Authorization header required (Bearer token)" });
    return;
  }

  const token = authHeader.slice("Bearer ".length);
  if (token !== apiKey) {
    res.status(403).json({ error: "Invalid admin API key" });
    return;
  }

  next();
}
