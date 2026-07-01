import type { ModerationCategory } from "./contentGuard.js";

export interface AlertPayload {
  anonId: string;
  category: ModerationCategory;
  reason: string;
  eventType: number;
  guildId: string | null;
  channelId: string | null;
  timestamp: string;
}

const CATEGORY_COLOR: Record<ModerationCategory, number> = {
  predator: 0xff4444,
  self_harm: 0xff8800,
  toxicity: 0xffaa00,
  scam: 0xffdd00,
  malicious_link: 0xaa44ff,
};

const CATEGORY_LABEL: Record<ModerationCategory, string> = {
  predator: "🚨 Predatory Solicitation",
  self_harm: "🆘 Self-Harm Language",
  toxicity: "⚠️ Toxic Content",
  scam: "🎣 Scam Attempt",
  malicious_link: "🔗 Malicious Link",
};

function isDiscordWebhook(url: string): boolean {
  return /discord(?:app)?\.com\/api\/webhooks\//.test(url);
}

function buildDiscordPayload(payload: AlertPayload): unknown {
  return {
    username: "FreeZone Guardian",
    avatar_url: "https://cdn-icons-png.flaticon.com/512/2344/2344819.png",
    embeds: [
      {
        title: CATEGORY_LABEL[payload.category],
        color: CATEGORY_COLOR[payload.category],
        description: `**Detection reason:** ${payload.reason}`,
        fields: [
          {
            name: "Anonymous Subject ID",
            value: `\`${payload.anonId}\``,
            inline: true,
          },
          {
            name: "Event Type",
            value: `TYPE_${payload.eventType}`,
            inline: true,
          },
          ...(payload.guildId
            ? [{ name: "Guild", value: `\`${payload.guildId}\``, inline: true }]
            : []),
          ...(payload.channelId
            ? [{ name: "Channel", value: `\`${payload.channelId}\``, inline: true }]
            : []),
        ],
        footer: {
          text: "FreeZone Content Moderation Guard • No PII stored",
        },
        timestamp: payload.timestamp,
      },
    ],
  };
}

function buildGenericPayload(payload: AlertPayload): unknown {
  return {
    alert: true,
    category: payload.category,
    label: CATEGORY_LABEL[payload.category],
    reason: payload.reason,
    anonId: payload.anonId,
    eventType: payload.eventType,
    guildId: payload.guildId,
    channelId: payload.channelId,
    timestamp: payload.timestamp,
    source: "FreeZone Content Moderation Guard",
  };
}

async function postOnce(url: string, body: unknown): Promise<void> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) {
    throw new Error(`Alert webhook responded ${res.status}`);
  }
}

/**
 * Fire-and-forget alert to ALERT_WEBHOOK_URL.
 * Retries once on failure. Never throws — errors are logged to stderr.
 */
export function sendAlert(payload: AlertPayload, log: { warn: (obj: unknown, msg: string) => void }): void {
  const url = process.env["ALERT_WEBHOOK_URL"];
  if (!url) return;

  const body = isDiscordWebhook(url)
    ? buildDiscordPayload(payload)
    : buildGenericPayload(payload);

  (async () => {
    try {
      await postOnce(url, body);
    } catch {
      try {
        await new Promise((r) => setTimeout(r, 2000));
        await postOnce(url, body);
      } catch (retryErr) {
        log.warn({ err: retryErr, category: payload.category }, "Alert webhook failed after retry");
      }
    }
  })();
}
