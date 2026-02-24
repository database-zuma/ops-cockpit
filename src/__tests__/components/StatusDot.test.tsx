import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusDot } from "@/components/ui/StatusDot";
import type { RagStatus } from "@/lib/design-tokens";

const statuses: RagStatus[] = ["critical", "warning", "caution", "normal", "info"];
const expectedColorClasses: Record<RagStatus, string> = {
  critical: "bg-rag-critical",
  warning: "bg-rag-warning",
  caution: "bg-rag-caution",
  normal: "bg-rag-normal",
  info: "bg-rag-info",
};

describe("StatusDot", () => {
  it.each(statuses)("renders %s status with correct color class", (status) => {
    render(<StatusDot status={status} />);
    const indicator = screen.getByTestId("status-indicator");
    expect(indicator.className).toContain(expectedColorClasses[status]);
  });

  it("renders label when provided", () => {
    render(<StatusDot status="normal" label="Healthy" />);
    expect(screen.getByTestId("status-label")).toHaveTextContent("Healthy");
  });

  it("does not render label when not provided", () => {
    render(<StatusDot status="info" />);
    expect(screen.queryByTestId("status-label")).not.toBeInTheDocument();
  });

  it("shows pulse animation for critical status by default", () => {
    render(<StatusDot status="critical" />);
    expect(screen.getByTestId("status-pulse")).toBeInTheDocument();
  });

  it("does not show pulse for non-critical status by default", () => {
    render(<StatusDot status="normal" />);
    expect(screen.queryByTestId("status-pulse")).not.toBeInTheDocument();
  });

  it("shows pulse when pulse=true regardless of status", () => {
    render(<StatusDot status="info" pulse />);
    expect(screen.getByTestId("status-pulse")).toBeInTheDocument();
  });
});
