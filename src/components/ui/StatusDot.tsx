import type { RagStatus } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

interface StatusDotProps {
  status: RagStatus;
  label?: string;
  pulse?: boolean;
}

const statusColors: Record<RagStatus, string> = {
  critical: "bg-rag-critical",
  warning: "bg-rag-warning",
  caution: "bg-rag-caution",
  normal: "bg-rag-normal",
  info: "bg-rag-info",
};

const statusGlowColors: Record<RagStatus, string> = {
  critical: "shadow-[0_0_8px_#ff3333]",
  warning: "shadow-[0_0_8px_#ff9933]",
  caution: "shadow-[0_0_8px_#ffcc00]",
  normal: "shadow-[0_0_8px_#33ff99]",
  info: "shadow-[0_0_8px_#33ccff]",
};

export function StatusDot({ status, label, pulse = false }: StatusDotProps) {
  const shouldPulse = pulse || status === "critical";

  return (
    <span className="inline-flex items-center gap-2" data-testid="status-dot">
      <span className="relative flex h-3 w-3">
        {shouldPulse && (
          <span
            className={cn(
              "absolute inline-flex h-full w-full animate-ping rounded-full opacity-50",
              statusColors[status]
            )}
            data-testid="status-pulse"
          />
        )}
        <span
          className={cn(
            "relative inline-flex h-3 w-3 rounded-full",
            statusColors[status],
            statusGlowColors[status]
          )}
          data-testid="status-indicator"
        />
      </span>
      {label && (
        <span
          className="text-sm text-muted-foreground"
          data-testid="status-label"
        >
          {label}
        </span>
      )}
    </span>
  );
}
