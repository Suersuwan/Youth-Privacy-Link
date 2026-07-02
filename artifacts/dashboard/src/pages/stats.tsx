import { useGetEventStats, getGetEventStatsQueryKey } from "@workspace/api-client-react";
import { BarChart3, Users, Hash, Clock, Server, AlertTriangle, Bell, Heart } from "lucide-react";

export function Stats() {
  const { data: stats } = useGetEventStats({
    query: {
      queryKey: getGetEventStatsQueryKey(),
      refetchInterval: 10000,
    }
  });

  const formatUptime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}h ${m}m ${s}s`;
  };

  const flagRate = stats && stats.totalEvents > 0
    ? ((stats.flaggedEvents / stats.totalEvents) * 100).toFixed(1)
    : "0.0";

  return (
    <div className="flex flex-col h-full p-6 overflow-auto font-mono">
      <header className="mb-8 pb-4 border-b border-border">
        <h1 className="text-2xl font-bold tracking-tight text-foreground uppercase flex items-center gap-3">
          <Server className="w-6 h-6 text-primary" />
          System Telemetry
        </h1>
        <p className="text-muted-foreground text-xs mt-2 uppercase tracking-widest">Aggregated statistics & content moderation counts</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
        <StatCard
          icon={<Hash className="w-6 h-6" />}
          label="Total Intercepts"
          value={stats?.totalEvents.toLocaleString() || "..."}
        />
        <StatCard
          icon={<Users className="w-6 h-6" />}
          label="Unique Subjects"
          value={stats?.uniqueAnonIds.toLocaleString() || "..."}
        />
        <StatCard
          icon={<BarChart3 className="w-6 h-6" />}
          label="Event Types"
          value={Object.keys(stats?.byEventType || {}).length.toString() || "..."}
        />
        <StatCard
          icon={<Clock className="w-6 h-6" />}
          label="Uptime"
          value={stats ? formatUptime(stats.uptimeSeconds) : "..."}
        />
        <StatCard
          icon={<AlertTriangle className="w-6 h-6" />}
          label="Flagged Events"
          value={stats?.flaggedEvents.toLocaleString() ?? "..."}
          accent="destructive"
          sub={stats && stats.totalEvents > 0 ? `${flagRate}% of traffic` : undefined}
        />
        <StatCard
          icon={<Bell className="w-6 h-6" />}
          label="Alerts Fired"
          value={stats?.alertsFired.toLocaleString() ?? "..."}
          accent="destructive"
          sub="Predator · Self-harm"
        />
        <StatCard
          icon={<Heart className="w-6 h-6" />}
          label="Support Sent"
          value={stats?.supportMessagesSent?.toLocaleString() ?? "0"}
          accent="support"
          sub="Peer support prompts"
        />
      </div>

      {/* Content Moderation Guard status bar */}
      <div className="mb-6 p-4 rounded border border-primary/20 bg-primary/5 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_var(--color-primary)]" />
          <span className="text-[11px] font-bold uppercase tracking-widest text-primary">Content Moderation Guard — Active</span>
        </div>
        <div className="sm:ml-auto flex flex-wrap gap-4 text-[10px] text-muted-foreground uppercase tracking-widest font-mono">
          {["Toxicity", "Predator", "Scam", "Malicious Link", "Self-Harm"].map((cat) => (
            <span key={cat} className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary/50" />
              {cat}
            </span>
          ))}
        </div>
      </div>

      <div className="bg-card border border-border p-6 rounded shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
        <h2 className="text-sm font-bold uppercase tracking-widest mb-6 pb-3 border-b border-border/50 text-muted-foreground flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-primary/50" />
          Event Distribution Vector
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {stats?.byEventType && Object.entries(stats.byEventType).map(([type, count]) => (
            <div key={type} className="bg-secondary/40 border border-border p-4 flex flex-col gap-3 relative overflow-hidden group hover:border-primary/30 transition-colors">
              <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="text-[10px] text-muted-foreground/70 uppercase tracking-widest font-bold">Type_{type}</div>
              <div className="text-2xl font-bold text-primary tracking-tight">{count.toLocaleString()}</div>
            </div>
          ))}

          {(!stats?.byEventType || Object.keys(stats.byEventType).length === 0) && (
            <div className="col-span-full py-12 text-center text-muted-foreground uppercase tracking-widest text-xs">
              No event vectors detected.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  accent = "primary",
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: "primary" | "destructive" | "support";
  sub?: string;
}) {
  const color =
    accent === "destructive" ? "text-destructive"
    : accent === "support" ? "text-green-400"
    : "text-primary";
  const glow =
    accent === "destructive" ? "drop-shadow-[0_0_8px_rgba(220,38,38,0.5)]"
    : accent === "support" ? "drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]"
    : "drop-shadow-[0_0_8px_rgba(0,255,209,0.5)]";
  const bar =
    accent === "destructive" ? "from-destructive/50"
    : accent === "support" ? "from-green-500/50"
    : "from-primary/50";

  return (
    <div className="bg-card border border-border p-6 relative overflow-hidden group shadow-lg">
      <div className={`absolute top-0 right-0 p-6 ${color} opacity-5 transform translate-x-2 -translate-y-2 group-hover:scale-110 group-hover:opacity-10 transition-all duration-500`}>
        {icon}
      </div>
      <div className="relative z-10 flex items-center gap-3 text-muted-foreground mb-4">
        <div className={`${color} ${glow}`}>{icon}</div>
        <h3 className="text-[10px] font-bold uppercase tracking-widest">{label}</h3>
      </div>
      <div className={`text-4xl font-bold tracking-tight ${color} relative z-10`}>
        {value}
      </div>
      {sub && (
        <div className="text-[10px] text-muted-foreground/60 uppercase tracking-widest mt-1 relative z-10">{sub}</div>
      )}
      <div className={`absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r ${bar} to-transparent`} />
    </div>
  );
}
