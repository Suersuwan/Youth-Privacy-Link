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

/* ══════════════════════════════════════════════════════════════
   CATEGORY 1 — SELF-HARM  (checked first — highest priority)
   Catches suicidal ideation, self-injury, and crisis language.
══════════════════════════════════════════════════════════════ */
const SELF_HARM_PHRASES: string[] = [
  // suicidal ideation
  "want to kill myself", "wanna kill myself", "want to end my life",
  "going to end it", "going to end it all", "end it all",
  "thinking about suicide", "planning to suicide", "plan to commit suicide",
  "suicidal", "contemplating suicide", "considering suicide",
  "i don't want to be alive", "i don't want to live anymore",
  "no reason to live", "life isn't worth living", "life is not worth living",
  "i give up on life", "i'm done with life", "done with this life",
  "goodbye cruel world", "this is my last message",
  // self-injury
  "cut myself", "cutting myself", "i want to cut", "i cut myself",
  "hurting myself", "hurt myself", "harm myself",
  "self harm", "selfharm", "self-harm", "self-mutilate",
  "burn myself", "burning myself",
  // medication / overdose
  "overdose on", "take all my pills", "swallow all my pills",
  "pills to die", "od on", "intentional overdose",
  // suffocation / hanging (phrased carefully without instructional content)
  "rope myself", "hanging myself",
  // eating disorders severe
  "starving myself to death", "purging until",
];

/* ══════════════════════════════════════════════════════════════
   CATEGORY 2 — PREDATOR
   Grooming tactics, solicitation, location extraction, secrecy.
══════════════════════════════════════════════════════════════ */
const PREDATOR_PHRASES: string[] = [
  // visual content solicitation
  "send me pics", "send pics", "send me photos", "send photos",
  "send me a pic", "send me nudes", "send nudes", "nude pics",
  "send me your body", "show me your body", "show me yourself",
  "pic or it didn't happen", "send feet", "send body",
  // age probing
  "how old are you", "what's your age", "what is your age",
  "are you a minor", "are you underage", "are you over 18",
  "asl", "a/s/l",
  // real-world meetup
  "meet me irl", "meet up with me", "let's meet irl",
  "come to my house", "come over to my place", "come to my place",
  "i'll pick you up", "meet me at", "let's hang out alone",
  "meet in person", "meet face to face",
  // secrecy / grooming control
  "keep this secret", "keep this between us", "don't tell anyone",
  "don't tell your parents", "don't tell your mom", "don't tell your dad",
  "our little secret", "just between us", "no one needs to know",
  "delete this chat", "delete these messages",
  // isolation
  "are you alone", "are you home alone", "is anyone home with you",
  "when are your parents not home", "when will you be alone",
  // platform switching to avoid monitoring
  "video call me", "facetime me", "let's video call",
  "snap me", "dm me on snap", "add me on snap", "my snap is",
  "dm me on insta", "my instagram is", "add me on telegram",
  "move to private", "let's talk privately", "text me privately",
  "here's my number", "call me on",
  // flattery grooming
  "you're so mature for your age", "you seem older than",
  "you're so beautiful for your age", "you're special",
  "i've never felt this way about someone so young",
  "we have a special connection", "you understand me like no one else",
  // gift-based grooming
  "i'll send you money", "i'll buy you", "i'll gift you",
  "i can buy you robux", "i can give you free",
];

/* ══════════════════════════════════════════════════════════════
   CATEGORY 3 — TOXICITY
   Direct harassment, hate, and targeted harm instructions.
══════════════════════════════════════════════════════════════ */
const TOXICITY_PHRASES: string[] = [
  // direct death wishes / targeted harassment
  "kys", "kill yourself", "go kill yourself", "end yourself",
  "you should die", "i want you to die", "i hope you die",
  "kill urself", "k y s",
  "rope yourself", "rope urself",
  "drink bleach", "go drink bleach",
  "nobody likes you", "everyone hates you", "you are worthless",
  "you have no friends", "no one cares about you", "you are nothing",
  // doxxing threats
  "i will dox you", "i'm going to dox you", "posting your address",
  "i know where you live", "i'll find you irl",
  // physical threats
  "i will hurt you", "i'm going to hurt you",
  "i will beat you up", "i'm going to kill you",
  // cyberbullying pile-ons
  "everyone report this account", "mass report",
  "spam report them", "let's raid",
];

/* ══════════════════════════════════════════════════════════════
   CATEGORY 4 — SCAM
   Financial fraud, fake giveaways, credential phishing.
══════════════════════════════════════════════════════════════ */
const SCAM_PHRASES: string[] = [
  // gaming currency scams
  "free robux", "free vbucks", "free v-bucks", "free nitro",
  "free discord nitro", "free minecraft", "free fortnite skins",
  "free roblox", "free gems", "free coins",
  // prize / lottery
  "you have won", "you've won", "you won a prize",
  "congratulations you won", "you are the winner",
  "claim your prize", "claim your reward", "claim your gift",
  "click to claim", "click here to claim",
  "limited time offer", "offer expires", "act now",
  // gift card fraud
  "send a gift card", "buy gift cards", "itunes gift card",
  "amazon gift card", "google play gift card", "steam gift card",
  "send the code", "send me the card number",
  // crypto / investment
  "send me crypto", "send bitcoin", "send btc", "send eth",
  "send ethereum", "send usdt", "crypto investment",
  "double your money", "double your bitcoin", "guaranteed profit",
  "invest now", "passive income guaranteed", "risk free investment",
  "get rich quick", "financial freedom fast",
  // wire / transfer
  "wire me", "wire transfer", "western union", "money transfer",
  "zelle me", "cashapp me", "venmo me",
  // credential phishing
  "account suspended", "your account will be banned",
  "verify your account", "verify your identity", "verify your email",
  "login to keep your account", "password reset required",
  "enter your password", "confirm your details",
  "your account has been compromised",
  // fake job / model scams
  "easy money from home", "work from home earn",
  "we are hiring models", "send photos for modeling",
  "paid per photo", "earn money for pics",
];

/* ══════════════════════════════════════════════════════════════
   CATEGORY 5 — MALICIOUS LINK
   Phishing domains, bare IPs, suspicious TLDs, URL shorteners.
══════════════════════════════════════════════════════════════ */

// Known lookalike / phishing domain patterns
const PHISHING_DOMAINS =
  /(?:discord[-_.]?gift|discord[-_.]?free|nitro[-_.]?gift|free[-_.]?nitro|steam[-_.]?community\.ru|paypa[l1]\.(?!com\b)|g[o0]{2}gle\.|faceb[o0]{2}k\.|free[-_.]?robux|roblox[-_.]?gift|claim[-_.]?free|prize[-_.]?claim|login[-_.]?verify|secure[-_.]?login[-_.]?now|account[-_.]?verify|verify[-_.]?account[-_.]?now)/gi;

// Suspicious TLDs commonly abused in scams / phishing
const SUSPICIOUS_TLD =
  /https?:\/\/[^\s<>'"]{0,120}\.(tk|ml|ga|cf|gq|xyz|top|click|download|work|loan|win|racing|party|science|accountant|stream|men|country|bid|trade|review|cricket|faith|date|webcam|gdn|pw|cc)\b/gi;

// Bare IP-address URLs
const BARE_IP_URL =
  /https?:\/\/(?:\d{1,3}\.){3}\d{1,3}(?:[:/]|$)/gi;

// Known URL shorteners used to mask destinations
const URL_SHORTENER =
  /https?:\/\/(?:bit\.ly|tinyurl\.com|t\.co|goo\.gl|ow\.ly|is\.gd|buff\.ly|rb\.gy|cutt\.ly|shorturl\.at|short\.io|v\.gd|clck\.ru|qps\.ru|u\.to|tr\.im|x\.co|lnkd\.in|adf\.ly|bc\.vc|bc\.vc|prettylnk\.com)\/[^\s]+/gi;

/* ══════════════════════════════════════════════════════════════
   Core matching helpers
══════════════════════════════════════════════════════════════ */

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
  return m ? m[0].substring(0, 80) : null;
}

/* ══════════════════════════════════════════════════════════════
   Public API
══════════════════════════════════════════════════════════════ */

/**
 * Scan a single string for all five threat categories.
 * Priority order: self_harm → predator → toxicity → malicious_link → scam
 */
export function scanContent(text: string): ModerationResult {
  if (!text || typeof text !== "string") return CLEAN;

  // 1 — Self-harm (highest priority — user safety)
  const selfHarm = matchesAny(text, SELF_HARM_PHRASES);
  if (selfHarm) {
    return { flagged: true, reason: "Self-harm or suicidal language detected", category: "self_harm" };
  }

  // 2 — Predator (groom/solicit signals)
  const predator = matchesAny(text, PREDATOR_PHRASES);
  if (predator) {
    return { flagged: true, reason: "Potential predatory solicitation detected", category: "predator" };
  }

  // 3 — Toxicity (targeted harassment / threats)
  const toxic = matchesAny(text, TOXICITY_PHRASES);
  if (toxic) {
    return { flagged: true, reason: "Toxic or threatening language detected", category: "toxicity" };
  }

  // 4 — Malicious link (pattern-based, before scam phrase check)
  const phishDomain = matchesPattern(text, PHISHING_DOMAINS);
  if (phishDomain) {
    return { flagged: true, reason: `Known phishing domain pattern: ${phishDomain}`, category: "malicious_link" };
  }

  const bareIp = matchesPattern(text, BARE_IP_URL);
  if (bareIp) {
    return { flagged: true, reason: `Bare IP-address URL: ${bareIp}`, category: "malicious_link" };
  }

  const suspTld = matchesPattern(text, SUSPICIOUS_TLD);
  if (suspTld) {
    return { flagged: true, reason: `Suspicious TLD link: ${suspTld}`, category: "malicious_link" };
  }

  const shortener = matchesPattern(text, URL_SHORTENER);
  if (shortener) {
    return { flagged: true, reason: `Obfuscated short link: ${shortener}`, category: "malicious_link" };
  }

  // 5 — Scam (fraud / financial manipulation)
  const scam = matchesAny(text, SCAM_PHRASES);
  if (scam) {
    return { flagged: true, reason: "Potential scam or financial fraud detected", category: "scam" };
  }

  return CLEAN;
}

/**
 * Recursively scan all string values in an arbitrary payload object.
 * Returns the first positive ModerationResult found, or CLEAN.
 * Max recursion depth: 8 levels.
 */
export function scanObject(obj: unknown, depth = 0): ModerationResult {
  if (depth > 8) return CLEAN;

  if (typeof obj === "string") return scanContent(obj);

  if (Array.isArray(obj)) {
    for (const item of obj) {
      const r = scanObject(item, depth + 1);
      if (r.flagged) return r;
    }
    return CLEAN;
  }

  if (obj !== null && typeof obj === "object") {
    for (const val of Object.values(obj)) {
      const r = scanObject(val, depth + 1);
      if (r.flagged) return r;
    }
  }

  return CLEAN;
}
