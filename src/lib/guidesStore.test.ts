import { describe, expect, it } from "vitest";
import {
  formatCitation,
  formatLocator,
  getFeesForVariant,
  getGuideById,
  getGuideBySlug,
  globalSearch,
  listGuides,
  type Guide,
} from "./guidesStore";

describe("guidesStore critical behavior", () => {
  it("finds a known guide by both guide_id and service_id", () => {
    const byGuideId = getGuideBySlug("guide.epassport");
    const byServiceId = getGuideById("svc.epassport");

    expect(byGuideId).toBeDefined();
    expect(byServiceId).toBeDefined();
    expect(byGuideId?.guide_id).toBe("guide.epassport");
    expect(byServiceId?.service_id).toBe("svc.epassport");
  });

  it("returns search results for known keyword and agency filters", () => {
    const searchResults = listGuides({ search: "passport" });
    const agencyResults = listGuides({ agency: "agency.dip" });

    expect(searchResults.length).toBeGreaterThan(0);
    expect(searchResults.some((g) => g.guide_id === "guide.epassport")).toBe(true);
    expect(agencyResults.every((g) => g.agency_id === "agency.dip")).toBe(true);
  });

  it("returns empty global search for short queries", () => {
    expect(globalSearch("a").guides).toHaveLength(0);
  });

  it("formats structured locators and citations consistently", () => {
    const locator = formatLocator({
      heading_path: ["Step 1", "Online Application"],
      selector: ".content",
    });
    const citation = formatCitation({
      source_page_id: "source.example",
      canonical_url: "https://example.gov.bd/guide",
      domain: "example.gov.bd",
      locator: { heading_path: ["Fees"], selector: "#fees" },
    });

    expect(locator).toBe("Step 1 > Online Application | .content");
    expect(citation).toBe("example.gov.bd › Fees | #fees");
  });

  it("falls back to section fees when variant fees are unavailable", () => {
    const mockGuide = {
      guide_id: "guide.test",
      service_id: "svc.test",
      agency_id: "agency.test",
      agency_name: "Test Agency",
      title: "Test Guide",
      sections: {
        fees: [
          {
            label: "Standard Fee",
            citations: [],
          },
        ],
      },
      variants: [
        {
          variant_id: "regular",
          label: "Regular",
          fees: [],
          processing_times: [],
        },
      ],
      meta: {
        total_steps: 0,
        total_citations: 0,
      },
    } as Guide;

    const fees = getFeesForVariant(mockGuide, "regular");
    expect(fees).toHaveLength(1);
    expect(fees[0]).toHaveProperty("label", "Standard Fee");
  });
});
