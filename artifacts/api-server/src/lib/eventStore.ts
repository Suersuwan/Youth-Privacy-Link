import { randomUUID } from "crypto";
import { Response } from "express";

export interface AnonymizedEvent {
  id: string;
  anonId: string;
  eventType: number;
  timestamp: string;
  guildId: string | null;
  channelId: string | null;
  flagged: boolean;
  flagReason: string | null;
  flagCategory: string | null;
}

export interface EventStats {
  totalEvents: number;
  uniqueAnonIds: number;
  byEventType: Record<string, number>;
  uptimeSeconds: number;
  flaggedEvents: number;
  alertsFired: number;
}

const MAX_EVENTS = 200;
const startedAt = Date.now();

const events: AnonymizedEvent[] = [];
const seenAnonIds = new Set<string>();
const byEventType: Record<string, number> = {};
let flaggedCount = 0;
let alertsCount = 0;
const sseClients = new Set<Response>();

export function recordEvent(
  anonId: string,
  eventType: number,
  guildId: string | null,
  channelId: string | null,
  flagged = false,
  flagReason: string | null = null,
  flagCategory: string | null = null,
): AnonymizedEvent {
  const event: AnonymizedEvent = {
    id: randomUUID(),
    anonId,
    eventType,
    timestamp: new Date().toISOString(),
    guildId,
    channelId,
    flagged,
    flagReason,
    flagCategory,
  };

  events.unshift(event);
  if (events.length > MAX_EVENTS) events.pop();

  seenAnonIds.add(anonId);
  byEventType[String(eventType)] = (byEventType[String(eventType)] ?? 0) + 1;
  if (flagged) flaggedCount++;

  broadcast(event);
  return event;
}

export function incrementAlerts(): void {
  alertsCount++;
}

export function getRecentEvents(limit = 50): AnonymizedEvent[] {
  return events.slice(0, Math.min(limit, MAX_EVENTS));
}

export function getStats(): EventStats {
  return {
    totalEvents: Object.values(byEventType).reduce((a, b) => a + b, 0),
    uniqueAnonIds: seenAnonIds.size,
    byEventType: { ...byEventType },
    uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
    flaggedEvents: flaggedCount,
    alertsFired: alertsCount,
  };
}

export function addSseClient(res: Response): void {
  sseClients.add(res);
}

export function removeSseClient(res: Response): void {
  sseClients.delete(res);
}

function broadcast(event: AnonymizedEvent): void {
  const data = `data: ${JSON.stringify(event)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(data);
    } catch {
      sseClients.delete(client);
    }
  }
}
