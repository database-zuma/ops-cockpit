import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MetricValue } from "@/components/ui/MetricValue";

describe("MetricValue", () => {
  it("renders a numeric value with formatting", () => {
    render(<MetricValue value={1250000} />);
    expect(screen.getByTestId("metric-number")).toHaveTextContent("1,250,000");
  });

  it("renders a string value as-is", () => {
    render(<MetricValue value="Rp 42.5M" />);
    expect(screen.getByTestId("metric-number")).toHaveTextContent("Rp 42.5M");
  });

  it("renders label when provided", () => {
    render(<MetricValue value={100} label="Total Sales" />);
    expect(screen.getByTestId("metric-label")).toHaveTextContent("Total Sales");
  });

  it("shows positive delta with up arrow and green color", () => {
    render(<MetricValue value={500} delta={12.5} />);
    const delta = screen.getByTestId("metric-delta");
    expect(delta).toBeInTheDocument();
    expect(screen.getByTestId("metric-delta-arrow")).toHaveTextContent("↑");
    expect(delta.className).toContain("text-rag-normal");
  });

  it("shows negative delta with down arrow and red color", () => {
    render(<MetricValue value={500} delta={-8.3} />);
    const delta = screen.getByTestId("metric-delta");
    expect(screen.getByTestId("metric-delta-arrow")).toHaveTextContent("↓");
    expect(delta.className).toContain("text-rag-critical");
  });

  it("shows zero delta with right arrow and muted color", () => {
    render(<MetricValue value={500} delta={0} />);
    const delta = screen.getByTestId("metric-delta");
    expect(screen.getByTestId("metric-delta-arrow")).toHaveTextContent("→");
    expect(delta.className).toContain("text-muted-foreground");
  });

  it("does not show delta when not provided", () => {
    render(<MetricValue value={500} />);
    expect(screen.queryByTestId("metric-delta")).not.toBeInTheDocument();
  });

  it("renders custom deltaLabel", () => {
    render(<MetricValue value={500} delta={5} deltaLabel="units" />);
    expect(screen.getByTestId("metric-delta")).toHaveTextContent("+5 units");
  });

  it("applies size classes", () => {
    const { rerender } = render(<MetricValue value={100} size="sm" />);
    expect(screen.getByTestId("metric-number").className).toContain("text-lg");

    rerender(<MetricValue value={100} size="lg" />);
    expect(screen.getByTestId("metric-number").className).toContain("text-4xl");
  });
});
