import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { MarkdownRenderer } from "./MarkdownRenderer";

describe("MarkdownRenderer", () => {
  it("renders bullet and numbered lists", () => {
    render(
      <MemoryRouter>
        <MarkdownRenderer content={"- First item\n- Second item\n\n1. Step one\n2. Step two"} />
      </MemoryRouter>,
    );

    expect(screen.getByText("First item")).toBeInTheDocument();
    expect(screen.getByText("Second item")).toBeInTheDocument();
    expect(screen.getByText("Step one")).toBeInTheDocument();
    expect(screen.getByText("Step two")).toBeInTheDocument();
  });

  it("renders internal links as router links and external links as anchors", () => {
    render(
      <MemoryRouter>
        <MarkdownRenderer
          content={
            "Go to [Guide](/guides/guide.epassport) and visit [Official Site](https://example.gov.bd)"
          }
        />
      </MemoryRouter>,
    );

    const internal = screen.getByRole("link", { name: "Guide" });
    const external = screen.getByRole("link", { name: "Official Site" });

    expect(internal).toHaveAttribute("href", "/guides/guide.epassport");
    expect(external).toHaveAttribute("href", "https://example.gov.bd");
    expect(external).toHaveAttribute("target", "_blank");
  });

  it("renders bold text markup", () => {
    render(
      <MemoryRouter>
        <MarkdownRenderer content={"This has **important** text."} />
      </MemoryRouter>,
    );

    expect(screen.getByText("important")).toContainHTML("strong");
  });
});
