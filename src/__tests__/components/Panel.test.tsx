import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Panel } from "@/components/ui/Panel";

describe("Panel", () => {
  it("renders children content", () => {
    render(<Panel>Hello Cockpit</Panel>);
    expect(screen.getByText("Hello Cockpit")).toBeInTheDocument();
  });

  it("applies glow styles when glow=true", () => {
    render(<Panel glow>Glowing</Panel>);
    const panel = screen.getByTestId("panel");
    expect(panel.className).toContain("shadow-");
  });

  it("does not apply glow styles by default", () => {
    render(<Panel>No glow</Panel>);
    const panel = screen.getByTestId("panel");
    expect(panel.className).not.toContain("shadow-");
  });

  it("renders title when provided", () => {
    render(<Panel title="Revenue">Content</Panel>);
    expect(screen.getByTestId("panel-title")).toHaveTextContent("Revenue");
  });

  it("does not render title when not provided", () => {
    render(<Panel>Content only</Panel>);
    expect(screen.queryByTestId("panel-title")).not.toBeInTheDocument();
  });

  it("applies custom className", () => {
    render(<Panel className="custom-class">Content</Panel>);
    const panel = screen.getByTestId("panel");
    expect(panel.className).toContain("custom-class");
  });
});
