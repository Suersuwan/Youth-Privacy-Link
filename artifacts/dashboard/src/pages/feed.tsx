import { useEffect, useState, useRef } from "react";
import {
  useListEvents,
  getListEventsQueryKey,
  useGetEventStats,
  getGetEventStatsQueryKey,
  type AnonymizedEvent,
} from "@workspace/api-client-react";
import { formatDistanceToNow, format } from "date-fns";
import { Activity, Shield, AlertTriangle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CrisisOverlay } from "@/components/CrisisOverlay";

function truncateId(id: string) {
  return id.substring(0, 8);
}

const CATEGORY_LABELS: Record<string, string> = {
  toxicity: "TOXIC",
  predator: "PREDATOR",
  scam: "SCAM",
  malicious_link: "MALICIOUS LINK",
  self_harm: "SELF-HARM",
};

export function Feed() {
  const { data: initialEvents } = useListEvents({ limit: 50 }, { query: { queryKey: getListEventsQueryKey({ limit: 50 }) } });
  const { data: stats } = useGetEventStats({ query: { queryKey: getGetEventStatsQueryKey(), refetchInterval: 10000 } });
  const [liveEvents, setLiveEvents] = useState<AnonymizedEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [crisisEvent, setCrisisEvent] = useState<AnonymizedEvent | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialEvents) {
      setLiveEvents(initialEvents);
    }
  }, [initialEvents]);

  useEffect(() => {
    const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
    const es = new EventSource(`${BASE}/api/events/stream`);

    es.onopen = () => setIsConnected(true);
    es.onerror = () => setIsConnected(false);

    es.onmessage = (e) => {
      const event = JSON.parse(e.data) as AnonymizedEvent;
      setLiveEvents((prev) => [event, ...prev].slice(0, 200));
      // Only trigger crisis overlay for real-time self_harm events (not historical)
      if (event.flagged && event.flagCategory === "self_harm") {
        setCrisisEvent(event);
      }
    };

    return () => es.close();
  }, []);

  const flaggedCount = liveEvents.filter((e) => e.flagged).length;

  return (
    <div className="flex flex-col h-full p-6 overflow-hidden">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground uppercase flex items-center gap-3 font-mono">
            <Activity className="w-6 h-6 text-primary" />
            Live Intel Stream
          </h1>
          <p className="text-muted-foreground text-xs mt-2 uppercase tracking-widest font-mono">Real-time anonymized event intercept</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-4 mr-4 font-mono text-xs text-muted-foreground">
            <div className="flex flex-col">
              <span className="uppercase tracking-widest text-[10px]">Total EVTS</span>
              <span className="text-foreground font-bold">{stats?.totalEvents.toLocaleString() || "..."}</span>
            </div>
            <div className="w-px h-6 bg-border" />
            <div className="flex flex-col">
              <span className="uppercase tracking-widest text-[10px]">Anon IDs</span>
              <span className="text-foreground font-bold">{stats?.uniqueAnonIds.toLocaleString() || "..."}</span>
            </div>
            <div className="w-px h-6 bg-border" />
            <div className="flex flex-col">
              <span className="uppercase tracking-widest text-[10px] text-destructive/80">Flagged</span>
              <span className={`font-bold ${flaggedCount > 0 ? "text-destructive" : "text-foreground"}`}>
                {flaggedCount}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-secondary/80 px-4 py-2 border border-border rounded shadow-inner">
            <div className={`w-2.5 h-2.5 rounded-full ${isConnected ? "bg-primary animate-pulse shadow-[0_0_12px_var(--color-primary)]" : "bg-destructive shadow-[0_0_12px_var(--color-destructive)]"}`} />
            <span className={`text-[10px] font-bold tracking-widest uppercase font-mono ${isConnected ? "text-primary" : "text-destructive"}`}>
              {isConnected ? "Secure Uplink Active" : "Uplink Dropped"}
            </span>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-auto border border-border rounded bg-card p-4 relative font-mono shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]" ref={containerRef}>
        <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:100%_4px]" />

        <div className="space-y-1 relative z-10 text-sm">
          {liveEvents.length === 0 ? (
            <div className="text-muted-foreground text-center py-20 uppercase tracking-widest flex flex-col items-center gap-4">
              <Shield className="w-12 h-12 opacity-20" />
              <span>Awaiting transmission...</span>
            </div>
          ) : (
            liveEvents.map((evt) => (
              <div
                key={evt.id}
                className={`flex items-center gap-4 py-2.5 px-3 border-b transition-colors group ${
                  evt.flagged
                    ? "border-destructive/30 bg-destructive/5 hover:bg-destructive/10"
                    : "border-border/40 hover:bg-secondary/40"
                }`}
              >
                {/* flag icon */}
                {evt.flagged && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <AlertTriangle className="w-3.5 h-3.5 text-destructive shrink-0 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="font-mono text-xs bg-secondary border-destructive/40 text-destructive max-w-xs">
                      <p className="font-bold mb-1">{evt.flagCategory ? CATEGORY_LABELS[evt.flagCategory] ?? evt.flagCategory : "FLAGGED"}</p>
                      <p className="text-muted-foreground">{evt.flagReason}</p>
                    </TooltipContent>
                  </Tooltip>
                )}

                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className={`w-20 shrink-0 text-[10px] uppercase tracking-wider cursor-help opacity-70 group-hover:opacity-100 transition-opacity ${evt.flagged ? "text-destructive/60" : "text-muted-foreground"}`}>
                      {formatDistanceToNow(new Date(evt.timestamp), { addSuffix: true })}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="font-mono text-xs bg-secondary border-primary/30 text-primary">
                    {format(new Date(evt.timestamp), "yyyy-MM-dd HH:mm:ss.SSS")}
                  </TooltipContent>
                </Tooltip>

                <div className="flex items-center gap-2 w-32 shrink-0">
                  <span className="text-[10px] uppercase text-muted-foreground/60 font-bold tracking-widest">EVT</span>
                  <span className={`font-medium group-hover:text-primary transition-colors ${evt.flagged ? "text-destructive/80" : "text-primary/90"}`}>
                    {truncateId(evt.id)}
                  </span>
                </div>

                <div className="flex items-center gap-2 w-32 shrink-0">
                  <span className="text-[10px] uppercase text-muted-foreground/60 font-bold tracking-widest">SUB</span>
                  <span className="text-foreground/80 font-medium">{truncateId(evt.anonId)}</span>
                </div>

                <div className="flex-1 flex gap-3 items-center flex-wrap">
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold border uppercase tracking-wider ${
                    evt.flagged
                      ? "bg-destructive/10 text-destructive border-destructive/30"
                      : "bg-primary/10 text-primary border-primary/20 shadow-[0_0_8px_rgba(0,255,209,0.1)]"
                  }`}>
                    TYPE_{evt.eventType}
                  </span>

                  {evt.flagged && evt.flagCategory && (
                    <span className="bg-destructive/10 text-destructive px-2 py-0.5 rounded text-[10px] font-bold border border-destructive/30 uppercase tracking-wider animate-pulse">
                      {CATEGORY_LABELS[evt.flagCategory] ?? evt.flagCategory}
                    </span>
                  )}

                  {evt.guildId && (
                    <span className="bg-secondary text-muted-foreground px-2 py-0.5 rounded text-[10px] border border-border font-medium">
                      G:{truncateId(evt.guildId)}
                    </span>
                  )}
                  {evt.channelId && (
                    <span className="bg-secondary text-muted-foreground px-2 py-0.5 rounded text-[10px] border border-border font-medium">
                      C:{truncateId(evt.channelId)}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <CrisisOverlay event={crisisEvent} onDismiss={() => setCrisisEvent(null)} />
    </div>
  );
}
