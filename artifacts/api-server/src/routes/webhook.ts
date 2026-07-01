import { Router, type IRouter, Request, Response } from "express";
import { z } from "zod";
import { anonymizePayload, getAnonId } from "../lib/anonymize.js";
import { rateLimit } from "../middlewares/rateLimit.js";
import { discordWebhookAuth } from "../middlewares/discordWebhookAuth.js";
import { recordEvent, incrementAlerts } from "../lib/eventStore.js";
import { scanObject } from "../lib/contentGuard.js";
import { sendAlert } from "../lib/alertWebhook.js";
import type { ModerationCategory } from "../lib/contentGuard.js";

const router: IRouter = Router();

const HIGH_SEVERITY: Set<ModerationCategory> = new Set(["predator", "self_harm"]);

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
  async (req: Request, res: Response) => {
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

    try {
      const anonymized = await anonymizePayload(raw as Record<string, unknown>);

      const realUserId = raw.user?.id ?? raw.member?.user?.id;
      const anonId = realUserId
        ? await getAnonId(realUserId)
        : (anonymized["id"] as string | undefined) ?? "unknown";

      const moderation = scanObject(raw.data);

      if (moderation.flagged) {
        req.log.warn(
          { category: moderation.category, reason: moderation.reason },
          "Content moderation guard flagged event",
        );

        if (moderation.category && HIGH_SEVERITY.has(moderation.category)) {
          sendAlert(
            {
              anonId,
              category: moderation.category,
              reason: moderation.reason ?? "No reason provided",
              eventType: raw.type,
              guildId: raw.guild_id ?? null,
              channelId: raw.channel_id ?? null,
              timestamp: new Date().toISOString(),
            },
            req.log,
          );
          incrementAlerts();
        }
      }

      recordEvent(
        anonId,
        raw.type,
        raw.guild_id ?? null,
        raw.channel_id ?? null,
        moderation.flagged,
        moderation.reason,
        moderation.category,
      );

      req.log.info({ type: raw.type, flagged: moderation.flagged }, "Discord webhook received");
      res.json({ ok: true, data: anonymized });
    } catch (err) {
      req.log.error({ err }, "Failed to anonymize payload");
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

export default router;
