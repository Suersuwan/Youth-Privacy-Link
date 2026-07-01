import { Link, useLocation } from "wouter";
import { Activity, BarChart3, ShieldCheck, ShieldAlert, Home } from "lucide-react";
import { useHealthCheck, getHealthCheckQueryKey } from "@workspace/api-client-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { data: health } = useHealthCheck({ query: { queryKey: getHealthCheckQueryKey(), refetchInterval: 30000 } });

  const navItem = (href: string, Icon: React.ElementType, label: string) => {
    const active = location === href;
    return (
      <Link
        href={href}
        className={`flex items-center gap-3 px-4 py-3 rounded transition-all duration-200 ${
          active
            ? "bg-primary/10 text-primary border border-primary/30 shadow-[inset_0_0_12px_rgba(0,255,209,0.1)]"
            : "text-muted-foreground hover:bg-secondary hover:text-foreground border border-transparent"
        }`}
      >
        <Icon className="w-4 h-4" />
        <span className="text-sm font-semibold tracking-wide uppercase">{label}</span>
      </Link>
    );
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground font-mono dark">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card flex flex-col z-10 relative shadow-[4px_0_24px_rgba(0,0,0,0.5)]">
        <div className="p-6 border-b border-border bg-background">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-primary drop-shadow-[0_0_8px_var(--color-primary)]" />
            <span className="font-bold text-lg tracking-tight uppercase text-foreground">FreeZone</span>
          </div>
          <div className="text-[10px] text-primary/70 mt-2 uppercase tracking-widest font-semibold">
            Secure Comms Monitor
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItem("/", Home, "Home")}
          {navItem("/feed", Activity, "Live Feed")}
          {navItem("/stats", BarChart3, "Telemetry")}
        </nav>

        <div className="p-4 border-t border-border text-xs flex items-center gap-2 bg-background/50">
          {health?.status === "ok" ? (
            <div className="flex items-center gap-2 text-primary">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_var(--color-primary)]" />
              <span className="uppercase tracking-widest text-[10px] font-bold">System Nominal</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-destructive">
              <ShieldAlert className="w-4 h-4" />
              <span className="uppercase tracking-widest text-[10px] font-bold">System Offline</span>
            </div>
          )}
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-background to-background" />
        <div className="relative z-10 w-full h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
