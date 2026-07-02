import { useMemo, useState } from "react";
import {
  useListEvents,
  getListEventsQueryKey,
  type AnonymizedEvent,
} from "@workspace/api-client-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { format, parseISO, startOfHour } from "date-fns";
import {
  Download,
  FileText,
  Shield,
  AlertTriangle,
  Filter,
} from "lucide-react";

/* ── category config ── */
type Category = "self_harm" | "predator" | "toxicity" | "malicious_link" | "scam";

const CATEGORIES: Category[] = ["self_harm", "predator", "toxicity", "malicious_link", "scam"];

const CAT: Record<Category, { label: string; color: string; bg: string; border: string }> = {
  self_harm:     { label: "Self-Harm",     color: "#f97316", bg: "bg-orange-500/10", border: "border-orange-500/30" },
  predator:      { label: "Predator",      color: "#ef4444", bg: "bg-red-500/10",    border: "border-red-500/30"    },
  toxicity:      { label: "Toxicity",      color: "#eab308", bg: "bg-yellow-500/10", border: "border-yellow-500/30" },
  malicious_link:{ label: "Malicious Link",color: "#06b6d4", bg: "bg-cyan-500/10",   border: "border-cyan-500/30"   },
  scam:          { label: "Scam",          color: "#a855f7", bg: "bg-purple-500/10", border: "border-purple-500/30" },
};

/* ── CSV export ── */
function exportCSV(events: AnonymizedEvent[]) {
  const headers = ["ID", "Anon ID", "Timestamp", "Category", "Reason", "Guild ID", "Channel ID"];
  const rows = events.map((e) => [
    e.id,
    e.anonId,
    e.timestamp,
    e.flagCategory ?? "",
    `"${(e.flagReason ?? "").replace(/"/g, '""')}"`,
    e.guildId ?? "",
    e.channelId ?? "",
  ]);
  const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `freezone-modlog-${format(new Date(), "yyyy-MM-dd")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ── custom recharts tooltip ── */
function ChartTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded p-3 shadow-xl font-mono text-xs min-w-[140px]">
      <p className="text-muted-foreground uppercase tracking-widest mb-2 text-[10px]">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-sm inline-block" style={{ backgroundColor: p.color }} />
            <span className="text-muted-foreground">{CAT[p.name as Category]?.label ?? p.name}</span>
          </span>
          <span className="font-bold text-foreground">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

/* ── main component ── */
export function ModLog() {
  const { data: allEvents, isLoading } = useListEvents(
    { limit: 200 },
    { query: { queryKey: getListEventsQueryKey({ limit: 200 }), refetchInterval: 15000 } },
  );

  const [activeFilter, setActiveFilter] = useState<Category | "all">("all");

  const flaggedEvents = useMemo(
    () => (allEvents ?? []).filter((e) => e.flagged && e.flagCategory),
    [allEvents],
  );

  const filtered = useMemo(
    () =>
      activeFilter === "all"
        ? flaggedEvents
        : flaggedEvents.filter((e) => e.flagCategory === activeFilter),
    [flaggedEvents, activeFilter],
  );

  /* category breakdown counts */
  const counts = useMemo(() => {
    const c: Partial<Record<Category, number>> = {};
    for (const e of flaggedEvents) {
      const cat = e.flagCategory as Category;
      if (cat) c[cat] = (c[cat] ?? 0) + 1;
    }
    return c;
  }, [flaggedEvents]);

  /* timeline: group by hour bucket */
  const timeline = useMemo(() => {
    const buckets: Record<string, Record<string, number>> = {};
    for (const e of flaggedEvents) {
      const hour = format(startOfHour(parseISO(e.timestamp)), "MM/dd HH:mm");
      if (!buckets[hour]) buckets[hour] = {};
      const cat = e.flagCategory ?? "unknown";
      buckets[hour][cat] = (buckets[hour][cat] ?? 0) + 1;
    }
    return Object.entries(buckets)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([hour, cats]) => ({ hour, ...cats }));
  }, [flaggedEvents]);

  return (
    <div className="flex flex-col h-full p-6 overflow-auto font-mono">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground uppercase flex items-center gap-3">
            <FileText className="w-6 h-6 text-primary" />
            Moderation Log
          </h1>
          <p className="text-muted-foreground text-xs mt-2 uppercase tracking-widest">
            Flagged event audit trail · anonymized · exportable
          </p>
        </div>
        <button
          onClick={() => exportCSV(filtered)}
          disabled={filtered.length === 0}
          className="flex items-center gap-2 px-4 py-2.5 rounded border border-primary/30 bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest hover:bg-primary/20 hover:shadow-[0_0_16px_rgba(0,255,209,0.2)] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Download className="w-3.5 h-3.5" />
          Export {activeFilter === "all" ? "All" : CAT[activeFilter].label} ({filtered.length})
        </button>
      </header>

      {/* Category filter pills + counts */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setActiveFilter("all")}
          className={`px-3 py-1.5 rounded border text-[11px] font-bold uppercase tracking-widest transition-all ${
            activeFilter === "all"
              ? "bg-primary/10 border-primary/40 text-primary shadow-[0_0_8px_rgba(0,255,209,0.15)]"
              : "border-border text-muted-foreground hover:border-primary/20 hover:text-foreground"
          }`}
        >
          All ({flaggedEvents.length})
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveFilter(cat)}
            className={`px-3 py-1.5 rounded border text-[11px] font-bold uppercase tracking-widest transition-all ${
              activeFilter === cat
                ? `${CAT[cat].bg} ${CAT[cat].border}`
                : "border-border text-muted-foreground hover:border-primary/20 hover:text-foreground"
            }`}
            style={activeFilter === cat ? { color: CAT[cat].color } : {}}
          >
            {CAT[cat].label} ({counts[cat] ?? 0})
          </button>
        ))}
      </div>

      {/* Timeline chart */}
      {timeline.length > 0 && (
        <div className="mb-6 bg-card border border-border rounded p-5 shadow-[inset_0_0_20px_rgba(0,0,0,0.4)]">
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-primary/50 rounded-sm" />
            Threat Activity Timeline — Grouped by Hour
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={timeline} margin={{ top: 4, right: 8, left: -16, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis
                dataKey="hour"
                tick={{ fontSize: 9, fill: "rgba(255,255,255,0.35)", fontFamily: "monospace" }}
                tickLine={false}
                axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
              />
              <YAxis
                tick={{ fontSize: 9, fill: "rgba(255,255,255,0.35)", fontFamily: "monospace" }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <RechartsTooltip content={<ChartTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
              <Legend
                formatter={(value) => (
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                    {CAT[value as Category]?.label ?? value}
                  </span>
                )}
                iconSize={8}
                iconType="square"
              />
              {CATEGORIES.map((cat) => (
                <Bar key={cat} dataKey={cat} stackId="a" fill={CAT[cat].color} opacity={0.85} radius={cat === "scam" ? [2, 2, 0, 0] : [0, 0, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Event table */}
      <div className="flex-1 bg-card border border-border rounded shadow-[inset_0_0_20px_rgba(0,0,0,0.4)] overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-40 text-muted-foreground text-xs uppercase tracking-widest">
            Loading moderation log…
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-4 text-muted-foreground">
            <Shield className="w-10 h-10 opacity-20" />
            <span className="text-xs uppercase tracking-widest">No flagged events in this category</span>
          </div>
        ) : (
          <div className="overflow-auto max-h-[480px]">
            <table className="w-full text-xs border-collapse">
              <thead className="sticky top-0 bg-background border-b border-border z-10">
                <tr>
                  {["Timestamp", "Anon ID", "Category", "Reason", "Channel"].map((h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 border-r border-border/40 last:border-r-0"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((evt, i) => {
                  const cat = (evt.flagCategory ?? "") as Category;
                  const cfg = CAT[cat];
                  return (
                    <tr
                      key={evt.id}
                      className={`border-b border-border/30 transition-colors group ${
                        i % 2 === 0 ? "bg-secondary/10" : ""
                      } hover:bg-destructive/5`}
                    >
                      {/* Timestamp */}
                      <td className="px-4 py-2.5 text-muted-foreground/70 whitespace-nowrap border-r border-border/20">
                        <span className="text-[10px]">
                          {format(parseISO(evt.timestamp), "MM/dd HH:mm:ss")}
                        </span>
                      </td>

                      {/* Anon ID */}
                      <td className="px-4 py-2.5 font-bold border-r border-border/20 whitespace-nowrap">
                        <span className="text-primary/80 group-hover:text-primary transition-colors">
                          {evt.anonId.substring(0, 8).toUpperCase()}
                        </span>
                      </td>

                      {/* Category badge */}
                      <td className="px-4 py-2.5 border-r border-border/20 whitespace-nowrap">
                        {cfg ? (
                          <span
                            className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider ${cfg.bg} ${cfg.border}`}
                            style={{ color: cfg.color }}
                          >
                            {cfg.label}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>

                      {/* Reason */}
                      <td className="px-4 py-2.5 text-muted-foreground border-r border-border/20 max-w-xs">
                        <span className="truncate block" title={evt.flagReason ?? ""}>
                          {evt.flagReason ?? "—"}
                        </span>
                      </td>

                      {/* Channel */}
                      <td className="px-4 py-2.5 text-muted-foreground/60 whitespace-nowrap">
                        {evt.channelId
                          ? <span className="font-mono text-[10px]">C:{evt.channelId.substring(0, 8)}</span>
                          : <span className="text-muted-foreground/30">—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {filtered.length > 0 && (
          <div className="px-4 py-2.5 border-t border-border/50 bg-background/30 flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground/50 text-[10px] uppercase tracking-widest">
              <AlertTriangle className="w-3 h-3" />
              {filtered.length} flagged event{filtered.length !== 1 ? "s" : ""}
              {activeFilter !== "all" && ` · filtered by ${CAT[activeFilter].label}`}
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/40 uppercase tracking-widest">
              <Filter className="w-3 h-3" />
              Anon IDs only · No PII
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
