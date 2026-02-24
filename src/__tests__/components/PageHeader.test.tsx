import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PageHeader } from "@/components/ui/PageHeader";

describe("PageHeader", () => {
  it("renders the title", () => {
    render(<PageHeader title="Dashboard" />);
    expect(screen.getByTestId("page-title")).toHaveTextContent("Dashboard");
  });

  it("renders subtitle when provided", () => {
    render(<PageHeader title="Dashboard" subtitle="Overview of store performance" />);
    expect(screen.getByTestId("page-subtitle")).toHaveTextContent(
      "Overview of store performance"
    );
  });

  it("does not render subtitle when not provided", () => {
    render(<PageHeader title="Dashboard" />);
    expect(screen.queryByTestId("page-subtitle")).not.toBeInTheDocument();
  });

  it("renders breadcrumb navigation", () => {
    render(
      <PageHeader
        title="Store Detail"
        breadcrumb={[
          { label: "Home", href: "/" },
          { label: "Stores", href: "/stores" },
          { label: "JKT-001" },
        ]}
      />
    );
    const nav = screen.getByTestId("breadcrumb");
    expect(nav).toBeInTheDocument();
    expect(screen.getAllByTestId("breadcrumb-link")).toHaveLength(2);
    expect(screen.getByTestId("breadcrumb-item")).toHaveTextContent("JKT-001");
  });

  it("does not render breadcrumb when not provided", () => {
    render(<PageHeader title="Dashboard" />);
    expect(screen.queryByTestId("breadcrumb")).not.toBeInTheDocument();
  });

  it("renders breadcrumb links with correct href", () => {
    render(
      <PageHeader
        title="Test"
        breadcrumb={[{ label: "Home", href: "/" }]}
      />
    );
    const link = screen.getByTestId("breadcrumb-link");
    expect(link).toHaveAttribute("href", "/");
  });
});
