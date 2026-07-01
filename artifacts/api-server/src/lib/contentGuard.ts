export type ModerationCategory =
  | "toxicity"
  | "predator"
  | "scam"
  | "malicious_link"
  | "self_harm";

export interface ModerationResult {
  flagged: boolean;
  reason: string | null;
  category: ModerationCategory | null;
}

const CLEAN: ModerationResult = { flagged: false, reason: null, category: null };

/* ──────────────────────────────────────────────────────
   Keyword banks  (lowercase phrases for exact matching)
────────────────────────────────────────────────────── */

const TOXICITY_PHRASES: string[] = [
  "kys", "kill yourself", "go kill yourself", "end yourself",
  "you should die", "nobody likes you", "kill urself",
  "i hope you die", "rope yourself", "drink bleach",
];

const PREDATOR_PHRASES: string[] = [
  "send me pics", "send pics", "send nudes", "send photos",
  "how old are you", "what's your age", "are you a minor",
  "meet me irl", "meet up with me", "come to my house",
  "keep this secret", "don't tell your parents", "don't tell anyone",
  "are you alone", "are you home alone",
  "video call me", "facetime me", "let's video",
  "snap me", "dm me on snap", "add me on snap",
  "you're so mature for your age", "you seem older than",
];

const SCAM_PHRASES: string[] = [
  "free robux", "free vbucks", "free nitro", "free minecraft",
  "click this link", "click the link", "click here to claim",
  "you have won", "you've won", "you won a prize", "congratulations you won",
  "claim your prize", "claim your reward", "claim your gift",
  "send a gift card", "buy gift cards", "itunes gift card", "amazon gift card",
  "send me crypto", "send bitcoin", "send eth",
  "double your money", "invest now", "guaranteed profit",
  "wire me", "western union", "money transfer",
  "account suspended", "verify your account", "verify your identity",
  "login to keep", "password reset required",
];

const SELF_HARM_PHRASES: string[] = [
  "want to kill myself", "want to die", "going to end it",
  "thinking about suicide", "planning to suicide", "suicidal",
  "cut myself", "hurting myself", "self harm", "selfharm",
  "overdose on", "take all my pills",
];

/* ──────────────────────────────────────────────────────
   URL / link patterns
────────────────────────────────────────────────────── */

const SUSPICIOUS_TLD = /https?:\/\/[^\s<>'"]+\.(tk|ml|ga|cf|gq|xyz|top|click|download|work|loan|win|racing|party|science|accountant|stream|men|country|bid|trade|review|cricket|faith|date|webcam)\b/gi;

const PHISHING_DOMAINS = /(?:discord[-_.]?gift|nitro[-_.]?gift|free[-_.]?nitro|steam[-_.]?community\.ru|paypa[l1]\.(?!com)|g[o0]{2}gle|faceb[o0]{2}k|free[-_.]?robux|roblox[-_.]?gift|claim[-_.]?free|prize[-_.]?claim)/gi;

const BARE_IP_URL = /https?:\/\/(?:\d{1,3}\.){3}\d{1,3}(?:[:\/]|$)/gi;

const URL_SHORTENER = /https?:\/\/(?:bit\.ly|tinyurl\.com|t\.co|goo\.gl|ow\.ly|is\.gd|buff\.ly|rb\.gy|cutt\.ly|shorturl\.at|short\.io)\/[^\s]+/gi;

/* ──────────────────────────────────────────────────────
   Core scanner
────────────────────────────────────────────────────── */

function matchesAny(text: string, phrases: string[]): string | null {
  const lower = text.toLowerCase();
  for (const phrase of phrases) {
    if (lower.includes(phrase)) return phrase;
  }
  return null;
}

function matchesPattern(text: string, pattern: RegExp): string | null {
  pattern.lastIndex = 0;
  const m = pattern.exec(text);
  return m ? m[0].substring(0, 60) : null;
}

export function scanContent(text: string): ModerationResult {
  if (!text || typeof text !== "string") return CLEAN;

  const selfHarm = matchesAny(text, SELF_HARM_PHRASES);
  if (selfHarm) {
    return { flagged: true, reason: `Self-harm language detected`, category: "self_harm" };
  }

  const predator = matchesAny(text, PREDATOR_PHRASES);
  if (predator) {
    return { flagged: true, reason: `Potential predatory solicitation detected`, category: "predator" };
  }

  const toxic = matchesAny(text, TOXICITY_PHRASES);
  if (toxic) {
    return { flagged: true, reason: `Toxic/harmful language detected`, category: "toxicity" };
  }

  const phishDomain = matchesPattern(text, PHISHING_DOMAINS);
  if (phishDomain) {
    return { flagged: true, reason: `Known phishing domain pattern: ${phishDomain}`, category: "malicious_link" };
  }

  const bareIp = matchesPattern(text, BARE_IP_URL);
  if (bareIp) {
    return { flagged: true, reason: `Bare IP address URL detected: ${bareIp}`, category: "malicious_link" };
  }

  const suspTld = matchesPattern(text, SUSPICIOUS_TLD);
  if (suspTld) {
    return { flagged: true, reason: `Suspicious TLD link detected: ${suspTld}`, category: "malicious_link" };
  }

  const shortener = matchesPattern(text, URL_SHORTENER);
  if (shortener) {
    return { flagged: true, reason: `Obfuscated short link detected: ${shortener}`, category: "malicious_link" };
  }

  const scam = matchesAny(text, SCAM_PHRASES);
  if (scam) {
    return { flagged: true, reason: `Potential scam content detected`, category: "scam" };
  }

  return CLEAN;
}

/**
 * Recursively scan all string values in an arbitrary object.
 * Returns the first positive moderation result found, or CLEAN.
 */
export function scanObject(obj: unknown, depth = 0): ModerationResult {
  if (depth > 6) return CLEAN;

  if (typeof obj === "string") return scanContent(obj);

  if (Array.isArray(obj)) {
    for (const item of obj) {
      const result = scanObject(item, depth + 1);
      if (result.flagged) return result;
    }
    return CLEAN;
  }

  if (obj !== null && typeof obj === "object") {
    for (const val of Object.values(obj)) {
      const result = scanObject(val, depth + 1);
      if (result.flagged) return result;
    }
  }

  return CLEAN;
}
