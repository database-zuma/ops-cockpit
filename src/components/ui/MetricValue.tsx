import { cn } from "@/lib/utils";

interface MetricValueProps {
  value: string | number;
  label?: string;
  delta?: number;
  deltaLabel?: string;
  size?: "sm" | "md" | "lg";
}

function formatNumber(val: string | number): string {
  if (typeof val === "string") return val;
  return val.toLocaleString("en-US");
}

function getDeltaColor(delta: number): string {
  if (delta > 0) return "text-rag-normal";
  if (delta < 0) return "text-rag-critical";
  return "text-muted-foreground";
}

function getDeltaArrow(delta: number): string {
  if (delta > 0) return "↑";
  if (delta < 0) return "↓";
  return "→";
}

const sizeClasses = {
  sm: "text-lg",
  md: "text-2xl",
  lg: "text-4xl",
} as const;

export function MetricValue({
  value,
  label,
  delta,
  deltaLabel,
  size = "md",
}: MetricValueProps) {
  return (
    <div data-testid="metric-value">
      {label && (
        <p
          className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground"
          data-testid="metric-label"
        >
          {label}
        </p>
      )}
      <p
        className={cn(
          "font-mono font-semibold leading-none text-foreground",
          sizeClasses[size]
        )}
        data-testid="metric-number"
      >
        {formatNumber(value)}
      </p>
      {delta !== undefined && (
        <p
          className={cn("mt-1 flex items-center gap-1 font-mono text-xs", getDeltaColor(delta))}
          data-testid="metric-delta"
        >
          <span data-testid="metric-delta-arrow">{getDeltaArrow(delta)}</span>
          <span>
            {delta > 0 ? "+" : ""}
            {delta.toLocaleString("en-US")}
            {deltaLabel ? ` ${deltaLabel}` : "%"}
          </span>
        </p>
      )}
    </div>
  );
}
