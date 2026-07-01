import { randomUUID } from "crypto";

interface AnonEntry {
  anonId: string;
  createdAt: number;
}

const TTL_MS = 24 * 60 * 60 * 1000;

const idStore = new Map<string, AnonEntry>();

function pruneExpired(): void {
  const now = Date.now();
  for (const [key, entry] of idStore.entries()) {
    if (now - entry.createdAt > TTL_MS) {
      idStore.delete(key);
    }
  }
}

export function getAnonId(realId: string): string {
  pruneExpired();
  const existing = idStore.get(realId);
  if (existing) return existing.anonId;
  const anonId = randomUUID();
  idStore.set(realId, { anonId, createdAt: Date.now() });
  return anonId;
}

export interface AnonymizedUser {
  anonId: string;
}

export function anonymizeUser(user: {
  id: string;
  username?: string;
  global_name?: string;
  discriminator?: string;
}): AnonymizedUser {
  return {
    anonId: getAnonId(user.id),
  };
}

export function anonymizePayload(payload: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(payload)) {
    if (key === "user" && value !== null && typeof value === "object") {
      result[key] = anonymizeUser(value as { id: string; username?: string; global_name?: string });
    } else if (key === "member" && value !== null && typeof value === "object") {
      const member = value as Record<string, unknown>;
      result[key] = {
        ...Object.fromEntries(
          Object.entries(member).filter(
            ([k]) => !["user", "nick", "nickname"].includes(k),
          ),
        ),
        user: member["user"]
          ? anonymizeUser(member["user"] as { id: string; username?: string })
          : undefined,
      };
    } else if (
      key === "author" &&
      value !== null &&
      typeof value === "object"
    ) {
      result[key] = anonymizeUser(value as { id: string; username?: string });
    } else if (key === "id" && typeof value === "string") {
      result[key] = getAnonId(value);
    } else if (key === "user_id" && typeof value === "string") {
      result[key] = getAnonId(value);
    } else if (key === "author_id" && typeof value === "string") {
      result[key] = getAnonId(value);
    } else if (
      [
        "username",
        "global_name",
        "nick",
        "nickname",
        "display_name",
        "email",
        "phone",
        "ip",
      ].includes(key)
    ) {
      result[key] = "[redacted]";
    } else if (Array.isArray(value)) {
      result[key] = value.map((item) =>
        item !== null && typeof item === "object"
          ? anonymizePayload(item as Record<string, unknown>)
          : item,
      );
    } else if (value !== null && typeof value === "object") {
      result[key] = anonymizePayload(value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }

  return result;
}
