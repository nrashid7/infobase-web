// Typed data layer for published guides
import guidesData from './published/public_guides.json';
import indexData from './published/public_guides_index.json';

// Types
export interface Citation {
  source_page_id: string;
  canonical_url: string;
  domain: string;
  page_title?: string;
  locator: string;
  quoted_text?: string;
  retrieved_at?: string;
  language?: string;
}

export interface Step {
  step_number: number;
  title: string;
  description: string;
  citations: Citation[];
}

export interface FeeItem {
  label: string;
  description?: string | null;
  citations: Citation[];
}

export interface VariantFee {
  text: string;
  structured_data?: {
    amount_bdt?: number;
    pages?: number;
    delivery_type?: string;
    delivery_days?: number;
  };
  citations: Citation[];
}

export interface Variant {
  variant_id: string;
  label: string;
  fees: VariantFee[];
  processing_times: Array<{
    text: string;
    citations: Citation[];
  }>;
}

export interface SectionItem {
  label: string;
  description?: string | null;
  citations: Citation[];
}

export interface GuideSections {
  application_steps?: Step[];
  fees?: FeeItem[];
  required_documents?: SectionItem[];
  eligibility?: SectionItem[];
  processing_time?: SectionItem[];
  portal_links?: SectionItem[];
  service_info?: SectionItem[];
}

export interface OfficialLink {
  label: string;
  url: string;
  source_page_id?: string;
}

export interface GuideMeta {
  total_steps: number;
  total_citations: number;
  verification_summary?: {
    total: number;
    verified: number;
    unverified: number;
    stale: number;
    deprecated: number;
    contradicted: number;
  };
  last_crawled_at?: string;
  source_domains?: string[];
  generated_at?: string;
  last_updated_at?: string;
  status?: string;
}

export interface Guide {
  guide_id: string;
  service_id: string;
  agency_id: string;
  agency_name: string;
  title: string;
  overview?: string | null;
  steps?: Step[] | null;
  sections: GuideSections;
  variants?: Variant[] | null;
  required_documents?: SectionItem[] | null;
  fees?: FeeItem[] | null;
  official_links?: OfficialLink[] | null;
  meta: GuideMeta;
}

export interface GuideIndexEntry {
  guide_id: string;
  service_id: string;
  agency_id: string;
  title: string;
  agency_name: string;
  keywords: string[];
  step_count: number;
  citation_count: number;
  status?: string;
}

interface GuidesData {
  $schema_version: string;
  generated_at: string;
  source_kb_version: number;
  guides: Guide[];
}

interface IndexData {
  $schema_version: string;
  generated_at: string;
  source_kb_version: number;
  entries: GuideIndexEntry[];
}

// Type the imported data
const guides = (guidesData as GuidesData).guides;
const index = (indexData as IndexData).entries;

// Build lookup maps
const guideById = new Map<string, Guide>();
guides.forEach(g => {
  guideById.set(g.guide_id, g);
  // Also index by service_id for backwards compat
  guideById.set(g.service_id, g);
});

// Extract unique agencies
const agencies = Array.from(new Map(guides.map(g => [g.agency_id, { id: g.agency_id, name: g.agency_name }])).values());

/**
 * List all guides with optional search and agency filtering
 */
export function listGuides(options?: { search?: string; agency?: string }): GuideIndexEntry[] {
  let results = [...index];
  
  if (options?.agency) {
    results = results.filter(g => g.agency_id === options.agency);
  }
  
  if (options?.search) {
    const searchLower = options.search.toLowerCase();
    results = results.filter(g => 
      g.title.toLowerCase().includes(searchLower) ||
      g.agency_name.toLowerCase().includes(searchLower) ||
      g.keywords.some(k => k.toLowerCase().includes(searchLower))
    );
  }
  
  return results;
}

/**
 * Get a single guide by ID (accepts guide_id or service_id)
 */
export function getGuideById(id: string): Guide | undefined {
  return guideById.get(id);
}

/**
 * Get guide statistics
 */
export function getGuideStats(): { 
  guides: number; 
  agencies: number; 
  lastUpdated: string | null;
  totalCitations: number;
} {
  const totalCitations = guides.reduce((sum, g) => sum + (g.meta.total_citations || 0), 0);
  const lastUpdated = (guidesData as GuidesData).generated_at || null;
  
  return {
    guides: guides.length,
    agencies: agencies.length,
    lastUpdated,
    totalCitations
  };
}

/**
 * List all agencies
 */
export function listAgencies(): Array<{ id: string; name: string }> {
  return agencies;
}

/**
 * Detect available variants from a guide
 */
export type VariantType = 'regular' | 'express' | 'super_express';

export function getVariantTypes(guide: Guide): VariantType[] {
  if (!guide.variants || guide.variants.length === 0) {
    return [];
  }
  
  return guide.variants
    .map(v => v.variant_id as VariantType)
    .filter(v => ['regular', 'express', 'super_express'].includes(v));
}

/**
 * Get fees for a specific variant
 */
export function getFeesForVariant(guide: Guide, variantId?: VariantType): VariantFee[] | FeeItem[] {
  if (variantId && guide.variants) {
    const variant = guide.variants.find(v => v.variant_id === variantId);
    if (variant && variant.fees.length > 0) {
      return variant.fees;
    }
  }
  
  // Fallback to general fees
  return guide.fees || guide.sections.fees || [];
}

/**
 * Format citation for display
 */
export function formatCitation(citation: Citation): string {
  const parts: string[] = [];
  if (citation.domain) parts.push(citation.domain);
  if (citation.locator) parts.push(citation.locator);
  return parts.join(' › ') || citation.canonical_url;
}
