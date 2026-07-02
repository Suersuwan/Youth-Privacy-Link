import { useEffect, useState } from "react";
import { X, ShieldAlert, Phone, MessageSquare, Globe } from "lucide-react";
import type { AnonymizedEvent } from "@workspace/api-client-react";

interface Props {
  event: AnonymizedEvent | null;
  onDismiss: () => void;
}

const RESOURCES = [
  {
    icon: <Phone className="w-3.5 h-3.5" />,
    label: "988 Suicide & Crisis Lifeline",
    action: "Call or Text 988",
    href: "tel:988",
    color: "text-orange-400",
  },
  {
    icon: <MessageSquare className="w-3.5 h-3.5" />,
    label: "Crisis Text Line",
    action: "Text HOME to 741741",
    href: "sms:741741?body=HOME",
    color: "text-amber-400",
  },
  {
    icon: <Globe className="w-3.5 h-3.5" />,
    label: "International Crisis Centres",
    action: "iasp.info/resources",
    href: "https://www.iasp.info/resources/Crisis_Centres/",
    color: "text-yellow-400",
  },
];

export function CrisisOverlay({ event, onDismiss }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!event) {
      setVisible(false);
      return;
    }
    // slight delay so CSS transition plays on mount
    const t = setTimeout(() => setVisible(true), 20);
    return () => clearTimeout(t);
  }, [event]);

  function handleDismiss() {
    setVisible(false);
    // wait for slide-out before clearing
    setTimeout(onDismiss, 350);
  }

  if (!event) return null;

  const anonId = event.anonId.substring(0, 8).toUpperCase();

  return (
    <div
      role="alertdialog"
      aria-modal="false"
      aria-label="Crisis resource alert"
      className={`fixed bottom-6 left-6 z-50 w-[340px] transition-all duration-350 ease-out ${
        visible
          ? "translate-y-0 opacity-100"
          : "translate-y-8 opacity-0 pointer-events-none"
      }`}
    >
      {/* Outer glow ring */}
      <div className="absolute -inset-px rounded-xl bg-gradient-to-br from-orange-500/60 via-red-500/30 to-transparent blur-[2px] pointer-events-none" />

      <div className="relative bg-card border border-orange-500/40 rounded-xl shadow-[0_0_40px_rgba(249,115,22,0.25)] overflow-hidden">
        {/* top accent */}
        <div className="h-0.5 w-full bg-gradient-to-r from-orange-500 via-red-500 to-transparent" />

        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-3 border-b border-orange-500/20">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-500/15 border border-orange-500/30 flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(249,115,22,0.3)]">
              <ShieldAlert className="w-4 h-4 text-orange-400" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-orange-400/80 font-mono">
                Crisis Signal Detected
              </p>
              <p className="text-foreground text-xs font-bold font-mono leading-tight">
                User&nbsp;
                <span className="text-orange-300">{anonId}</span>
                &nbsp;may need help
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="shrink-0 w-6 h-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            aria-label="Dismiss crisis alert"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Flag reason */}
        <div className="px-4 py-3 border-b border-orange-500/10 bg-orange-500/5">
          <p className="text-[11px] text-muted-foreground font-sans leading-relaxed">
            <span className="text-orange-400 font-semibold">Auto-flagged: </span>
            {event.flagReason ?? "Self-harm language detected in message"}
          </p>
        </div>

        {/* Resources */}
        <div className="px-4 pt-3 pb-1">
          <p className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground/60 font-mono mb-2.5">
            Crisis Resources — Share Immediately
          </p>
          <div className="space-y-2">
            {RESOURCES.map((r) => (
              <a
                key={r.label}
                href={r.href}
                target={r.href.startsWith("http") ? "_blank" : undefined}
                rel={r.href.startsWith("http") ? "noopener noreferrer" : undefined}
                className="flex items-center gap-3 p-2.5 rounded-lg border border-border hover:border-orange-500/40 hover:bg-orange-500/5 transition-all group"
              >
                <div className={`shrink-0 ${r.color} opacity-80 group-hover:opacity-100 transition-opacity`}>
                  {r.icon}
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground font-sans truncate leading-tight">
                    {r.label}
                  </p>
                  <p className={`text-xs font-bold font-mono ${r.color}`}>{r.action}</p>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 pt-3 pb-4">
          <button
            onClick={handleDismiss}
            className="w-full py-2.5 rounded border border-orange-500/30 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 text-[11px] font-bold uppercase tracking-widest font-mono transition-all hover:shadow-[0_0_12px_rgba(249,115,22,0.2)]"
          >
            Mark Reviewed & Dismiss
          </button>
          <p className="text-center text-[9px] text-muted-foreground/40 uppercase tracking-widest font-mono mt-2">
            Alert logged · Anon ID only · No PII stored
          </p>
        </div>
      </div>
    </div>
  );
}
