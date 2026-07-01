import { Router, type IRouter, Request, Response } from "express";
import { z } from "zod";
import { getRecentEvents, getStats, addSseClient, removeSseClient } from "../lib/eventStore.js";

const router: IRouter = Router();

const LimitSchema = z.coerce.number().int().min(1).max(200).default(50);

router.get("/events", (req: Request, res: Response) => {
  const parsed = LimitSchema.safeParse(req.query["limit"]);
  const limit = parsed.success ? parsed.data : 50;
  res.json(getRecentEvents(limit));
});

router.get("/events/stats", (_req: Request, res: Response) => {
  res.json(getStats());
});

router.get("/events/stream", (req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  res.write(": connected\n\n");

  addSseClient(res);

  req.on("close", () => {
    removeSseClient(res);
  });
});

export default router;
