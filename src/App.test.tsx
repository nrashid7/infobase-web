import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

vi.mock("@/components/ui/toaster", () => ({
  Toaster: () => null,
}));

vi.mock("@/components/ui/tooltip", () => ({
  TooltipProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/lib/LanguageContext", () => ({
  LanguageProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("./layouts/MainLayout", async () => {
  const router = await import("react-router-dom");
  return {
    MainLayout: () => <router.Outlet />,
  };
});

vi.mock("./pages/Index", () => ({
  default: () => <div>IndexPage</div>,
}));
vi.mock("./pages/Guides", () => ({
  default: () => <div>GuidesPage</div>,
}));
vi.mock("./pages/GuideDetail", () => ({
  default: () => <div>GuideDetailPage</div>,
}));
vi.mock("./pages/Directory", () => ({
  default: () => <div>DirectoryPage</div>,
}));
vi.mock("./pages/SiteDetail", () => ({
  default: () => <div>SiteDetailPage</div>,
}));
vi.mock("./pages/About", () => ({
  default: () => <div>AboutPage</div>,
}));
vi.mock("./pages/NotFound", () => ({
  default: () => <div>NotFoundPage</div>,
}));
vi.mock("./pages/ServicesRedirect", () => ({
  default: () => <div>ServicesRedirectPage</div>,
}));
vi.mock("./pages/BulkScrape", () => ({
  default: () => <div>BulkScrapePage</div>,
}));

import App from "./App";

afterEach(() => {
  cleanup();
});

describe("App routing", () => {
  it("renders not found route for unknown paths", async () => {
    window.history.pushState({}, "", "/unknown-route");
    render(<App />);

    expect(await screen.findByText("NotFoundPage")).toBeInTheDocument();
  });

  it("redirects /sources to /directory", async () => {
    window.history.pushState({}, "", "/sources");
    render(<App />);

    expect(await screen.findByText("DirectoryPage")).toBeInTheDocument();
  });
});
