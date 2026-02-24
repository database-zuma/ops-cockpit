import { cn } from "@/lib/utils";

interface PanelProps {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
  title?: string;
}

export function Panel({ children, className, glow = false, title }: PanelProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-panel-border bg-panel-bg p-4",
        glow && "shadow-[0_0_20px_rgba(0,255,204,0.15)] border-accent-primary/30",
        className
      )}
      data-testid="panel"
    >
      {title && (
        <h3
          className="mb-3 text-xs font-medium uppercase tracking-widest text-muted-foreground"
          data-testid="panel-title"
        >
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}
