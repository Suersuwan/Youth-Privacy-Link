import { useState, useEffect } from "react";
import { ShieldCheck } from "lucide-react";

const STORAGE_KEY = "freezone_safety_accepted";

const RULES = [
  {
    id: "self_harm",
    icon: "🆘",
    color: "from-orange-500/20 to-orange-500/5",
    border: "border-orange-500/30",
    accent: "#f97316",
    label: "You Always Matter",
    rule: "If you're struggling, say something. FreeZone has your back — we flag crisis signals and connect help. Never suffer in silence.",
  },
  {
    id: "predator",
    icon: "🚨",
    color: "from-red-500/20 to-red-500/5",
    border: "border-red-500/30",
    accent: "#ef4444",
    label: "No Predators. Ever.",
    rule: "Never share personal info, photos, or location with strangers. Anyone asking you to keep secrets or meet IRL gets reported immediately.",
  },
  {
    id: "toxicity",
    icon: "⚡",
    color: "from-yellow-500/20 to-yellow-500/5",
    border: "border-yellow-500/30",
    accent: "#eab308",
    label: "Lift Each Other Up",
    rule: "Hate speech, death threats, and targeted harassment are removed on sight. FreeZone is a zone — not a warzone.",
  },
  {
    id: "scam",
    icon: "🎣",
    color: "from-purple-500/20 to-purple-500/5",
    border: "border-purple-500/30",
    accent: "#a855f7",
    label: "No Scams. Stay Sharp.",
    rule: "No fake giveaways, gift card requests, or crypto schemes. If it sounds too good to be true, it is. We catch it automatically.",
  },
  {
    id: "malicious_link",
    icon: "🔗",
    color: "from-cyan-500/20 to-cyan-500/5",
    border: "border-cyan-500/30",
    accent: "#06b6d4",
    label: "Links Get Checked",
    rule: "Phishing links, IP URLs, and suspicious shorteners are blocked before they reach anyone. Never click unknown links — report them.",
  },
];

export function WelcomeModal() {
  const [visible, setVisible] = useState(false);
  const [checked, setChecked] = useState(false);
  const [entering, setEntering] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem(STORAGE_KEY);
    if (!accepted) setVisible(true);
  }, []);

  function handleAccept() {
    if (!checked) return;
    setEntering(true);
    setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, "1");
      setVisible(false);
      setEntering(false);
    }, 600);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm font-mono dark overflow-y-auto py-8 px-4">
      {/* scanline overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.025] bg-[linear-gradient(rgba(255,255,255,0.15)_1px,transparent_1px)] bg-[size:100%_3px]" />
      {/* top glow */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,rgba(0,255,209,0.08),transparent)]" />

      <div className="relative w-full max-w-xl mx-auto">
        {/* Card */}
        <div className="relative bg-card border border-border rounded-lg shadow-[0_0_80px_rgba(0,255,209,0.08)] overflow-hidden">
          {/* top accent bar */}
          <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-primary to-transparent" />

          {/* Header */}
          <div className="pt-8 pb-6 px-8 text-center border-b border-border">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center shadow-[0_0_24px_rgba(0,255,209,0.2)]">
                <ShieldCheck className="w-8 h-8 text-primary drop-shadow-[0_0_8px_var(--color-primary)]" />
              </div>
            </div>
            <h1 className="text-2xl font-bold uppercase tracking-tight text-foreground mb-1">
              Welcome to FreeZone
            </h1>
            <p className="text-[11px] text-primary/70 uppercase tracking-[0.3em] font-semibold">
              Freestyle Safety Code
            </p>
            <p className="text-muted-foreground text-sm mt-3 font-sans leading-relaxed">
              FreeZone is built for you to express freely — and for every user to
              stay safe. Before you enter, read our five rules:
            </p>
          </div>

          {/* Rules */}
          <div className="px-6 py-5 space-y-3">
            {RULES.map((r, i) => (
              <div
                key={r.id}
                className={`flex gap-4 p-4 rounded-lg bg-gradient-to-r ${r.color} border ${r.border} group transition-all duration-200`}
              >
                <div className="text-2xl shrink-0 leading-none mt-0.5">{r.icon}</div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="text-[10px] font-bold uppercase tracking-[0.2em]"
                      style={{ color: r.accent }}
                    >
                      Rule {i + 1}
                    </span>
                    <span className="text-foreground text-xs font-bold uppercase tracking-wider">
                      — {r.label}
                    </span>
                  </div>
                  <p className="text-muted-foreground text-[12px] leading-relaxed font-sans">
                    {r.rule}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Acceptance */}
          <div className="px-6 pb-8 space-y-5 pt-2">
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="relative shrink-0 mt-0.5">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={checked}
                  onChange={(e) => setChecked(e.target.checked)}
                />
                <div
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                    checked
                      ? "bg-primary border-primary shadow-[0_0_10px_rgba(0,255,209,0.4)]"
                      : "border-border bg-background group-hover:border-primary/50"
                  }`}
                >
                  {checked && (
                    <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 12 12">
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
              </div>
              <span className="text-sm text-muted-foreground font-sans leading-relaxed group-hover:text-foreground transition-colors">
                I agree to keep FreeZone a safe space for everyone. I understand
                that automated content moderation is active and violations are
                flagged in real time.
              </span>
            </label>

            <button
              onClick={handleAccept}
              disabled={!checked || entering}
              className={`w-full flex items-center justify-center gap-3 py-3.5 rounded text-sm font-bold uppercase tracking-widest transition-all duration-300 ${
                checked && !entering
                  ? "bg-primary text-primary-foreground shadow-[0_0_24px_rgba(0,255,209,0.4)] hover:shadow-[0_0_32px_rgba(0,255,209,0.6)] hover:bg-primary/90"
                  : "bg-secondary text-muted-foreground cursor-not-allowed border border-border"
              }`}
            >
              {entering ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                  Entering FreeZone…
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  Enter FreeZone
                  <span className="text-base leading-none">→</span>
                </>
              )}
            </button>

            <p className="text-center text-[10px] text-muted-foreground/40 uppercase tracking-widest">
              No personal data collected · Zero identity tracking · FreeZone // Safe Space
            </p>
          </div>

          {/* bottom accent bar */}
          <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        </div>
      </div>
    </div>
  );
}
