import { randomUUID } from "crypto";
import { db, anonIdsTable } from "@workspace/db";
import { eq, lt } from "drizzle-orm";
import { logger } from "./logger.js";

const TTL_MS = 24 * 60 * 60 * 1000;

interface CacheEntry {
  anonId: string;
  expiresAt: number;
}

const memCache = new Map<string, CacheEntry>();

async function pruneExpiredDb(): Promise<void> {
  try {
    await db.delete(anonIdsTable).where(lt(anonIdsTable.expiresAt, new Date()));
  } catch (err) {
    logger.warn({ err }, "Failed to prune expired anon IDs from DB");
  }
}

let lastPrune = 0;
async function maybePruneExpired(): Promise<void> {
  const now = Date.now();
  if (now - lastPrune > 60 * 60 * 1000) {
    lastPrune = now;
    void pruneExpiredDb();
  }
  for (const [key, entry] of memCache.entries()) {
    if (now > entry.expiresAt) {
      memCache.delete(key);
    }
  }
}

export async function getAnonId(realId: string): Promise<string> {
  await maybePruneExpired();

  const cached = memCache.get(realId);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.anonId;
  }

  try {
    const [existing] = await db
      .select()
      .from(anonIdsTable)
      .where(eq(anonIdsTable.realId, realId))
      .limit(1);

    if (existing && existing.expiresAt > new Date()) {
      memCache.set(realId, {
        anonId: existing.anonId,
        expiresAt: existing.expiresAt.getTime(),
      });
      return existing.anonId;
    }
  } catch (err) {
    logger.warn({ err }, "DB lookup failed, falling back to in-memory store");
    const fallback = randomUUID();
    memCache.set(realId, { anonId: fallback, expiresAt: Date.now() + TTL_MS });
    return fallback;
  }

  const anonId = randomUUID();
  const expiresAt = new Date(Date.now() + TTL_MS);

  try {
    await db
      .insert(anonIdsTable)
      .values({ realId, anonId, expiresAt })
      .onConflictDoUpdate({
        target: anonIdsTable.realId,
        set: { anonId, expiresAt },
      });
  } catch (err) {
    logger.warn({ err }, "DB insert failed for anon ID, using in-memory only");
  }

  memCache.set(realId, { anonId, expiresAt: expiresAt.getTime() });
  return anonId;
}

export interface AnonymizedUser {
  anonId: string;
}

export async function anonymizeUser(user: {
  id: string;
  username?: string;
  global_name?: string;
  discriminator?: string;
}): Promise<AnonymizedUser> {
  return { anonId: await getAnonId(user.id) };
}

export async function anonymizePayload(
  payload: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(payload)) {
    if (key === "user" && value !== null && typeof value === "object") {
      result[key] = await anonymizeUser(
        value as { id: string; username?: string; global_name?: string },
      );
    } else if (key === "member" && value !== null && typeof value === "object") {
      const member = value as Record<string, unknown>;
      const sanitized = Object.fromEntries(
        Object.entries(member).filter(
          ([k]) => !["user", "nick", "nickname"].includes(k),
        ),
      );
      result[key] = {
        ...sanitized,
        user: member["user"]
          ? await anonymizeUser(
              member["user"] as { id: string; username?: string },
            )
          : undefined,
      };
    } else if (
      key === "author" &&
      value !== null &&
      typeof value === "object"
    ) {
      result[key] = await anonymizeUser(
        value as { id: string; username?: string },
      );
    } else if (key === "id" && typeof value === "string") {
      result[key] = await getAnonId(value);
    } else if (key === "user_id" && typeof value === "string") {
      result[key] = await getAnonId(value);
    } else if (key === "author_id" && typeof value === "string") {
      result[key] = await getAnonId(value);
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
      result[key] = await Promise.all(
        value.map((item) =>
          item !== null && typeof item === "object"
            ? anonymizePayload(item as Record<string, unknown>)
            : Promise.resolve(item),
        ),
      );
    } else if (value !== null && typeof value === "object") {
      result[key] = await anonymizePayload(value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }

  return result;
}
