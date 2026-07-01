import { useEffect, useState } from "react";
import { Link } from "wouter";
import {
  useListEvents,
  getListEventsQueryKey,
  useGetEventStats,
  getGetEventStatsQueryKey,
  type AnonymizedEvent,
} from "@workspace/api-client-react";
import { formatDistanceToNow } from "date-fns";
import { ShieldCheck, Zap, Lock, ArrowRight, Activity } from "lucide-react";

/* ─────────────────────────────────────────────
   Platform SVG icons
───────────────────────────────────────────── */
function TikTokIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.32 6.32 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.77a4.85 4.85 0 0 1-1.01-.08z" />
    </svg>
  );
}

function InstagramIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
    </svg>
  );
}

function DiscordIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.317 4.492c-1.53-.69-3.17-1.2-4.885-1.49a.075.075 0 0 0-.079.036c-.21.369-.444.85-.608 1.23a18.566 18.566 0 0 0-5.487 0 12.36 12.36 0 0 0-.617-1.23A.077.077 0 0 0 8.562 3c-1.714.29-3.354.8-4.885 1.491a.07.07 0 0 0-.032.027C.533 9.093-.32 13.555.099 17.961a.08.08 0 0 0 .031.055 20.03 20.03 0 0 0 5.993 2.98.078.078 0 0 0 .084-.026c.462-.62.874-1.275 1.226-1.963.021-.04.001-.088-.041-.104a13.201 13.201 0 0 1-1.872-.878.075.075 0 0 1-.008-.125c.126-.093.252-.19.372-.287a.075.075 0 0 1 .078-.01c3.927 1.764 8.18 1.764 12.061 0a.075.075 0 0 1 .079.009c.12.098.245.195.372.288a.075.075 0 0 1-.006.125c-.598.344-1.22.635-1.873.877a.075.075 0 0 0-.041.105c.36.687.772 1.341 1.225 1.962a.077.077 0 0 0 .084.028 19.963 19.963 0 0 0 6.002-2.981.076.076 0 0 0 .032-.054c.5-5.094-.838-9.52-3.549-13.442a.06.06 0 0 0-.031-.028zM8.02 15.278c-1.182 0-2.157-1.069-2.157-2.38 0-1.312.956-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.956 2.38-2.157 2.38zm7.975 0c-1.183 0-2.157-1.069-2.157-2.38 0-1.312.955-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.946 2.38-2.157 2.38z" />
    </svg>
  );
}

function XIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.26 5.632zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function YouTubeIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

/* ─────────────────────────────────────────────
   Platform card data
───────────────────────────────────────────── */
const platforms = [
  {
    name: "TikTok",
    icon: TikTokIcon,
    color: "from-[#010101] to-[#1a1a2e]",
    border: "border-[#69C9D0]/40",
    glow: "shadow-[0_0_20px_rgba(105,201,208,0.2)]",
    accent: "#69C9D0",
    label: "SYNCED",
  },
  {
    name: "Instagram",
    icon: InstagramIcon,
    color: "from-[#1a0a2e] to-[#2d1b4e]",
    border: "border-[#E1306C]/40",
    glow: "shadow-[0_0_20px_rgba(225,48,108,0.2)]",
    accent: "#E1306C",
    label: "SYNCED",
  },
  {
    name: "Discord",
    icon: DiscordIcon,
    color: "from-[#0a0e2a] to-[#1a1f4e]",
    border: "border-[#5865F2]/40",
    glow: "shadow-[0_0_20px_rgba(88,101,242,0.2)]",
    accent: "#5865F2",
    label: "ACTIVE",
  },
  {
    name: "X",
    icon: XIcon,
    color: "from-[#0a0a0a] to-[#1a1a1a]",
    border: "border-[#ffffff]/20",
    glow: "shadow-[0_0_20px_rgba(255,255,255,0.08)]",
    accent: "#ffffff",
    label: "SYNCED",
  },
  {
    name: "YouTube",
    icon: YouTubeIcon,
    color: "from-[#1a0000] to-[#2d0a0a]",
    border: "border-[#FF0000]/40",
    glow: "shadow-[0_0_20px_rgba(255,0,0,0.15)]",
    accent: "#FF0000",
    label: "SYNCED",
  },
];

/* ─────────────────────────────────────────────
   Feature highlights
───────────────────────────────────────────── */
const features = [
  {
    icon: Lock,
    label: "Anonymous IDs",
    desc: "Your identity is replaced with a 24h rotating UUID before any data is stored.",
  },
  {
    icon: Zap,
    label: "Real-Time Sync",
    desc: "Events from all platforms stream live with sub-second latency.",
  },
  {
    icon: ShieldCheck,
    label: "Zero Data Leaks",
    desc: "PII is stripped at the edge. No names, IDs, or emails ever touch our logs.",
  },
];

/* ─────────────────────────────────────────────
   Mini live-feed strip
───────────────────────────────────────────── */
function MiniLiveFeed() {
  const { data: initialEvents } = useListEvents(
    { limit: 8 },
    { query: { queryKey: getListEventsQueryKey({ limit: 8 }) } }
  );
  const { data: stats } = useGetEventStats({
    query: { queryKey: getGetEventStatsQueryKey(), refetchInterval: 10000 },
  });
  const [liveEvents, setLiveEvents] = useState<AnonymizedEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (initialEvents) setLiveEvents(initialEvents.slice(0, 8));
  }, [initialEvents]);

  useEffect(() => {
    const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
    const es = new EventSource(`${BASE}/api/events/stream`);
    es.onopen = () => setIsConnected(true);
    es.onerror = () => setIsConnected(false);
    es.onmessage = (e) => {
      const event = JSON.parse(e.data) as AnonymizedEvent;
      setLiveEvents((prev) => [event, ...prev].slice(0, 8));
    };
    return () => es.close();
  }, []);

  return (
    <section id="telemetry" className="py-20 px-6 md:px-12 lg:px-24 relative">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-xs text-primary/60 uppercase tracking-[0.3em] font-mono mb-2">
              Live System Feed
            </p>
            <h2 className="text-2xl md:text-3xl font-bold font-mono uppercase text-foreground">
              Real-Time Telemetry
            </h2>
            <p className="text-muted-foreground text-sm mt-2 font-mono">
              Anonymized events — zero PII, live ingestion
            </p>
          </div>
          <div className="flex items-center gap-6 font-mono text-xs text-muted-foreground">
            <div className="flex flex-col items-end">
              <span className="uppercase tracking-widest text-[10px] text-muted-foreground/60">Total Events</span>
              <span className="text-foreground font-bold text-lg">{stats?.totalEvents?.toLocaleString() ?? "—"}</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="uppercase tracking-widest text-[10px] text-muted-foreground/60">Anon IDs</span>
              <span className="text-foreground font-bold text-lg">{stats?.uniqueAnonIds?.toLocaleString() ?? "—"}</span>
            </div>
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded border ${isConnected ? "border-primary/30 bg-primary/5" : "border-destructive/30 bg-destructive/5"}`}>
              <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-primary animate-pulse shadow-[0_0_8px_var(--color-primary)]" : "bg-destructive"}`} />
              <span className={`text-[10px] font-bold tracking-widest uppercase ${isConnected ? "text-primary" : "text-destructive"}`}>
                {isConnected ? "Live" : "Offline"}
              </span>
            </div>
          </div>
        </div>

        <div className="border border-border rounded bg-card relative overflow-hidden shadow-[inset_0_0_40px_rgba(0,0,0,0.6)]">
          <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:100%_4px]" />
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top_left,rgba(0,255,209,0.04),transparent_60%)]" />

          {liveEvents.length === 0 ? (
            <div className="py-16 flex flex-col items-center gap-4 text-muted-foreground/40 font-mono text-xs uppercase tracking-widest">
              <Activity className="w-10 h-10 opacity-30" />
              <span>Awaiting transmission...</span>
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {liveEvents.map((evt) => (
                <div
                  key={evt.id}
                  className="flex items-center gap-3 md:gap-6 px-4 py-3 hover:bg-secondary/30 transition-colors font-mono text-xs"
                >
                  <span className="text-muted-foreground/50 w-20 shrink-0 text-[10px] uppercase tracking-wider">
                    {formatDistanceToNow(new Date(evt.timestamp), { addSuffix: true })}
                  </span>
                  <span className="text-[10px] text-muted-foreground/40 uppercase tracking-widest hidden sm:block">EVT</span>
                  <span className="text-primary/90 font-medium w-20 shrink-0">{evt.id.substring(0, 8)}</span>
                  <span className="text-[10px] text-muted-foreground/40 uppercase tracking-widest hidden sm:block">SUB</span>
                  <span className="text-foreground/70 w-20 shrink-0">{evt.anonId.substring(0, 8)}</span>
                  <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-[10px] font-bold border border-primary/20 uppercase tracking-wider">
                    TYPE_{evt.eventType}
                  </span>
                  {evt.guildId && (
                    <span className="hidden md:inline bg-secondary text-muted-foreground px-2 py-0.5 rounded text-[10px] border border-border">
                      G:{evt.guildId.substring(0, 8)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="border-t border-border px-4 py-3 flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/40">
              Showing last {liveEvents.length} events
            </span>
            <Link href="/feed" className="flex items-center gap-2 text-primary text-[11px] font-mono font-bold uppercase tracking-widest hover:underline">
              Full feed <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   Landing page
───────────────────────────────────────────── */
export function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground font-mono dark">
      {/* scanline overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.025] bg-[linear-gradient(rgba(255,255,255,0.15)_1px,transparent_1px)] bg-[size:100%_3px] z-0" />
      {/* radial glow top-right */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_80%_60%_at_70%_-10%,rgba(0,255,209,0.07),transparent)] z-0" />

      {/* ── TOP NAV ── */}
      <nav className="relative z-20 flex items-center justify-between px-6 md:px-12 lg:px-24 py-5 border-b border-border/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-6 h-6 text-primary drop-shadow-[0_0_8px_var(--color-primary)]" />
          <span className="font-bold text-lg tracking-tight uppercase text-foreground">Overwatch</span>
          <span className="hidden sm:inline text-[10px] text-primary/50 uppercase tracking-widest ml-2 font-semibold">// Youth Hub</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/feed" className="text-muted-foreground hover:text-foreground text-xs uppercase tracking-widest transition-colors hidden sm:block">
            Live Feed
          </Link>
          <Link href="/stats" className="text-muted-foreground hover:text-foreground text-xs uppercase tracking-widest transition-colors hidden sm:block mr-2">
            Telemetry
          </Link>
          <Link
            href="/feed"
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded text-xs font-bold uppercase tracking-widest hover:bg-primary/90 transition-colors shadow-[0_0_16px_rgba(0,255,209,0.3)]"
          >
            Enter Dashboard <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative z-10 px-6 md:px-12 lg:px-24 pt-20 pb-16 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 px-4 py-1.5 rounded-full mb-8 shadow-[0_0_12px_rgba(0,255,209,0.15)]">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <span className="text-primary text-[11px] font-bold uppercase tracking-[0.3em]">
            Secure · Private · Real-Time
          </span>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight mb-6 max-w-4xl">
          <span className="text-foreground">The Ultimate</span>
          <br />
          <span
            className="text-transparent bg-clip-text"
            style={{ backgroundImage: "linear-gradient(135deg, #00ffd1 0%, #00b8d4 40%, #7c3aed 100%)" }}
          >
            Youth Social Hub
          </span>
        </h1>

        <p className="text-muted-foreground text-base sm:text-lg md:text-xl max-w-2xl leading-relaxed mb-10 font-sans">
          Connecting{" "}
          <span className="text-foreground font-semibold">TikTok, Instagram, Discord,</span>{" "}
          and all your favorite apps in one secure, anonymized space — where you stay in control.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <a
            href="#platforms"
            className="flex items-center gap-2 bg-primary text-primary-foreground px-7 py-3.5 rounded text-sm font-bold uppercase tracking-widest hover:bg-primary/90 transition-all shadow-[0_0_24px_rgba(0,255,209,0.4)] hover:shadow-[0_0_32px_rgba(0,255,209,0.6)]"
          >
            See All Platforms <ArrowRight className="w-4 h-4" />
          </a>
          <Link
            href="/feed"
            className="flex items-center gap-2 border border-border bg-secondary/50 text-foreground px-7 py-3.5 rounded text-sm font-bold uppercase tracking-widest hover:border-primary/40 hover:bg-secondary transition-all"
          >
            <Activity className="w-4 h-4 text-primary" />
            View Live Feed
          </Link>
        </div>
      </section>

      {/* ── PLATFORM BADGES ── */}
      <section id="platforms" className="relative z-10 px-6 md:px-12 lg:px-24 py-16">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-xs text-muted-foreground/50 uppercase tracking-[0.3em] mb-3">
            Integrated Platforms
          </p>
          <h2 className="text-center text-2xl md:text-3xl font-bold uppercase mb-12 text-foreground">
            All Your Apps. One Hub.
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {platforms.map((p) => (
              <div
                key={p.name}
                className={`relative flex flex-col items-center gap-4 p-6 rounded-lg border bg-gradient-to-b ${p.color} ${p.border} ${p.glow} transition-all duration-300 hover:scale-[1.03] hover:brightness-110 group cursor-default`}
              >
                {/* status dot */}
                <div className="absolute top-3 right-3 flex items-center gap-1.5">
                  <span
                    className="w-1.5 h-1.5 rounded-full animate-pulse"
                    style={{ backgroundColor: p.accent, boxShadow: `0 0 6px ${p.accent}` }}
                  />
                  <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: p.accent }}>
                    {p.label}
                  </span>
                </div>

                {/* icon */}
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                  style={{
                    backgroundColor: `${p.accent}18`,
                    border: `1px solid ${p.accent}40`,
                    color: p.accent,
                    boxShadow: `0 0 20px ${p.accent}20`,
                  }}
                >
                  <p.icon size={28} />
                </div>

                {/* name */}
                <span className="text-foreground font-bold text-sm uppercase tracking-wider">{p.name}</span>

                {/* bottom bar */}
                <div
                  className="absolute bottom-0 left-4 right-4 h-px rounded-full opacity-50"
                  style={{ backgroundColor: p.accent }}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURE STRIP ── */}
      <section className="relative z-10 px-6 md:px-12 lg:px-24 py-12">
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6">
          {features.map((f) => (
            <div
              key={f.label}
              className="flex flex-col gap-3 p-6 rounded-lg border border-border bg-card hover:border-primary/30 transition-all duration-300 group"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                <f.icon className="w-5 h-5 text-primary" />
              </div>
              <p className="font-bold text-sm uppercase tracking-widest text-foreground">{f.label}</p>
              <p className="text-muted-foreground text-xs leading-relaxed font-sans">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* divider */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 md:px-12 lg:px-24">
        <div className="h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      </div>

      {/* ── LIVE TELEMETRY ── */}
      <div className="relative z-10">
        <MiniLiveFeed />
      </div>

      {/* ── FOOTER ── */}
      <footer className="relative z-10 border-t border-border/50 px-6 md:px-12 lg:px-24 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-primary/50" />
          <span className="text-[11px] text-muted-foreground/50 uppercase tracking-widest">
            Overwatch // Secure Youth Hub
          </span>
        </div>
        <div className="flex items-center gap-6 text-[11px] text-muted-foreground/40 uppercase tracking-widest">
          <Link href="/feed" className="hover:text-primary transition-colors">Live Feed</Link>
          <Link href="/stats" className="hover:text-primary transition-colors">Telemetry</Link>
        </div>
      </footer>
    </div>
  );
}
