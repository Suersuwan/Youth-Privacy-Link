import { Router, type IRouter, Request, Response } from "express";
import { z } from "zod";
import { incrementSupport } from "../lib/eventStore.js";
import { logger } from "../lib/logger.js";

const router: IRouter = Router();

const SupportBody = z.object({
  anonId: z.string().min(1).max(128),
  channelId: z.string().max(64).nullable().optional(),
});

/**
 * POST /api/crisis/support
 * Records a peer-support action for an anonymous user who triggered a self-harm
 * alert. Dispatches a safeguarding notice to ALERT_WEBHOOK_URL if configured.
 * No admin key required — anonId carries no PII.
 */
router.post("/crisis/support", async (req: Request, res: Response) => {
  const parsed = SupportBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body", issues: parsed.error.issues });
    return;
  }

  const { anonId, channelId } = parsed.data;

  incrementSupport();
  req.log.info({ anonId, channelId }, "Peer support prompt recorded");

  // Post a safeguarding notice to the alert webhook if configured
  const webhookUrl = process.env["ALERT_WEBHOOK_URL"];
  let notified = false;

  if (webhookUrl) {
    try {
      const isDiscord = webhookUrl.includes("discord.com/api/webhooks");

      const body = isDiscord
        ? JSON.stringify({
            embeds: [
              {
                title: "💚 Peer Support Action",
                description: [
                  `An admin has initiated a peer support response for anonymous user **\`${anonId}\`**.`,
                  channelId ? `**Channel:** \`${channelId}\`` : null,
                  "",
                  "Please follow your platform's safeguarding protocol and consider reaching out via Discord's moderation tools.",
                ]
                  .filter(Boolean)
                  .join("\n"),
                color: 0x22c55e,
                footer: { text: "FreeZone Safety · No PII stored · Anon ID only" },
                timestamp: new Date().toISOString(),
              },
            ],
          })
        : JSON.stringify({
            event: "CRISIS_SUPPORT_SENT",
            anonId,
            channelId: channelId ?? null,
            message: "Peer support action initiated. Please follow your safeguarding protocol.",
            timestamp: new Date().toISOString(),
          });

      const resp = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });

      notified = resp.ok;
      if (!resp.ok) {
        logger.warn({ status: resp.status }, "Crisis support webhook delivery failed");
      }
    } catch (err) {
      logger.warn({ err }, "Crisis support webhook error");
    }
  }

  res.json({ ok: true, notified });
});

export default router;
