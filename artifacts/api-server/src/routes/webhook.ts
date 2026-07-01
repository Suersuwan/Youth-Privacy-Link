import { Router, type IRouter, Request, Response } from "express";
import { z } from "zod";
import { anonymizePayload } from "../lib/anonymize.js";
import { rateLimit } from "../middlewares/rateLimit.js";
import { discordWebhookAuth } from "../middlewares/discordWebhookAuth.js";

const router: IRouter = Router();

const DiscordInteractionSchema = z.object({
  type: z.number(),
  id: z.string().optional(),
  application_id: z.string().optional(),
  guild_id: z.string().optional(),
  channel_id: z.string().optional(),
  user: z
    .object({
      id: z.string(),
      username: z.string().optional(),
      global_name: z.string().nullable().optional(),
      discriminator: z.string().optional(),
    })
    .optional(),
  member: z
    .object({
      user: z
        .object({
          id: z.string(),
          username: z.string().optional(),
        })
        .optional(),
      nick: z.string().nullable().optional(),
      roles: z.array(z.string()).optional(),
    })
    .optional(),
  data: z.record(z.string(), z.unknown()).optional(),
  token: z.string().optional(),
  version: z.number().optional(),
});

router.post(
  "/discord",
  rateLimit,
  discordWebhookAuth,
  (req: Request, res: Response) => {
    const parsed = DiscordInteractionSchema.safeParse(req.body);

    if (!parsed.success) {
      req.log.warn({ issues: parsed.error.issues }, "Invalid Discord payload shape");
      res.status(400).json({ error: "Invalid payload" });
      return;
    }

    const raw = parsed.data;

    if (raw.type === 1) {
      res.json({ type: 1 });
      return;
    }

    const anonymized = anonymizePayload(raw as Record<string, unknown>);

    req.log.info({ type: raw.type }, "Discord webhook received");

    res.json({ ok: true, data: anonymized });
  },
);

export default router;
