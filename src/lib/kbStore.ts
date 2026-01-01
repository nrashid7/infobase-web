import kbData from '@/data/kb.json';
import claimsByServiceData from '@/data/indexes/claims_by_service.json';
import claimsBySourcePageData from '@/data/indexes/claims_by_source_page.json';

// ============= NORMALIZED TYPES =============
// These are the clean, predictable types the UI uses

export type ClaimStatus = 'verified' | 'unverified' | 'stale' | 'deprecated' | 'contradicted';
export type DerivedStatus = ClaimStatus | 'partial';

export type NormalizedCategory = 
  | 'eligibility' 
  | 'fees' 
  | 'required_documents' 
  | 'processing_time' 
  | 'application_steps' 
  | 'portal_links' 
  | 'service_info';

export interface NormalizedAgency {
  id: string;
  short_name: string;
  name: string;
}

export interface NormalizedSourcePage {
  id: string;
  domain: string;
  canonical_url: string;
  fetched_at: string | null;
  content_hash: string | null;
  snapshot_ref: string | null;
}

export interface NormalizedCitation {
  source_page_id: string;
  locator: any | null;
  quoted_text: string | null;
  retrieved_at: string | null;
  language: string | null;
}

export interface NormalizedClaim {
  id: string;
  status: ClaimStatus;
  category: NormalizedCategory;
  summary: string | null;
  text: string;
  citations: NormalizedCitation[];
  // Verification fields
  verified_at: string | null;
  verified_by: string | null;
  verification_notes: string | null;
  stale_marked_at: string | null;
  stale_due_to_source_hash: boolean | null;
  previous_status: ClaimStatus | null;
  deprecated_at: string | null;
  deprecated_reason: string | null;
  // Extra data
  structured_data: any | null;
  tags: string[];
}

export interface NormalizedService {
  id: string;
  agency_id: string | null;
  name: string;
  description: string | null;
  portal_url: string | null;
  claim_ids: string[];
  status: DerivedStatus;
}

export interface NormalizedDocument {
  id: string;
  name: string;
  issuing_agency_id: string | null;
}

export interface NormalizedKB {
  schema_version: string;
  agencies: NormalizedAgency[];
  services: NormalizedService[];
  claims: NormalizedClaim[];
  source_pages: NormalizedSourcePage[];
  documents: NormalizedDocument[];
}

// ============= CATEGORY NORMALIZATION =============
const CATEGORY_MAP: Record<string, NormalizedCategory> = {
  // Fees
  'fee': 'fees',
  'fees': 'fees',
  
  // Application steps
  'step': 'application_steps',
  'application_steps': 'application_steps',
  'steps': 'application_steps',
  
  // Required documents
  'documents': 'required_documents',
  'required_documents': 'required_documents',
  'document': 'required_documents',
  
  // Processing time
  'processing': 'processing_time',
  'processing_time': 'processing_time',
  'time': 'processing_time',
  
  // Eligibility
  'eligibility': 'eligibility',
  
  // Portal links
  'link': 'portal_links',
  'portal_links': 'portal_links',
  'links': 'portal_links',
  'portal': 'portal_links',
};

function normalizeCategory(rawCategory: string | undefined | null): NormalizedCategory {
  if (!rawCategory) return 'service_info';
  const lower = rawCategory.toLowerCase().trim();
  return CATEGORY_MAP[lower] || 'service_info';
}

// ============= INDEXES =============
// Load indexes, fallback to empty objects
let claimsByServiceIndex: Record<string, string[]> = {};
let claimsBySourcePageIndex: Record<string, string[]> = {};

try {
  claimsByServiceIndex = claimsByServiceData as Record<string, string[]>;
} catch {
  claimsByServiceIndex = {};
}

try {
  claimsBySourcePageIndex = claimsBySourcePageData as Record<string, string[]>;
} catch {
  claimsBySourcePageIndex = {};
}

// ============= NORMALIZATION FUNCTION =============
function normalizeKB(rawKb: any): NormalizedKB {
  const raw = rawKb || {};
  
  // Normalize agencies
  const agencies: NormalizedAgency[] = (raw.agencies || []).map((a: any) => ({
    id: a.agency_id || a.id || '',
    short_name: a.short_name || a.name || '',
    name: a.name || a.short_name || '',
  }));

  // Normalize source pages
  const source_pages: NormalizedSourcePage[] = (raw.source_pages || []).map((sp: any) => ({
    id: sp.source_page_id || sp.id || '',
    domain: sp.domain || extractDomain(sp.canonical_url) || '',
    canonical_url: sp.canonical_url || '',
    fetched_at: sp.last_crawled_at || sp.fetched_at || null,
    content_hash: sp.content_hash || null,
    snapshot_ref: sp.snapshot_ref || null,
  }));

  // Build source page domain lookup for fallback
  const sourcePageDomains: Record<string, string> = {};
  source_pages.forEach(sp => {
    sourcePageDomains[sp.id] = sp.domain;
  });

  // Normalize claims
  const claims: NormalizedClaim[] = (raw.claims || []).map((c: any) => ({
    id: c.claim_id || c.id || '',
    status: (c.status as ClaimStatus) || 'unverified',
    category: normalizeCategory(c.claim_type || c.category),
    summary: c.summary || null,
    text: c.text || '',
    citations: (c.citations || []).map((cit: any) => ({
      source_page_id: cit.source_page_id || '',
      locator: cit.locator || null,
      quoted_text: cit.quoted_text || null,
      retrieved_at: cit.retrieved_at || null,
      language: cit.language || null,
    })),
    verified_at: c.verified_at || c.last_verified_at || null,
    verified_by: c.verified_by || null,
    verification_notes: c.verification_notes || null,
    stale_marked_at: c.stale_marked_at || null,
    stale_due_to_source_hash: c.stale_due_to_source_hash ?? null,
    previous_status: c.previous_status || null,
    deprecated_at: c.deprecated_at || null,
    deprecated_reason: c.deprecated_reason || null,
    structured_data: c.structured_data || null,
    tags: c.tags || [],
  }));

  // Build claims lookup for fallback index computation
  const claimsById: Record<string, NormalizedClaim> = {};
  claims.forEach(c => {
    claimsById[c.id] = c;
  });

  // Compute fallback indexes if needed
  if (Object.keys(claimsByServiceIndex).length === 0) {
    // Build from entity_ref in claims
    (raw.claims || []).forEach((c: any) => {
      const claimId = c.claim_id || c.id || '';
      const entityRef = c.entity_ref;
      if (entityRef?.type === 'service' && entityRef?.id) {
        if (!claimsByServiceIndex[entityRef.id]) {
          claimsByServiceIndex[entityRef.id] = [];
        }
        if (!claimsByServiceIndex[entityRef.id].includes(claimId)) {
          claimsByServiceIndex[entityRef.id].push(claimId);
        }
      }
    });
  }

  if (Object.keys(claimsBySourcePageIndex).length === 0) {
    claims.forEach(claim => {
      claim.citations.forEach(cit => {
        if (cit.source_page_id) {
          if (!claimsBySourcePageIndex[cit.source_page_id]) {
            claimsBySourcePageIndex[cit.source_page_id] = [];
          }
          if (!claimsBySourcePageIndex[cit.source_page_id].includes(claim.id)) {
            claimsBySourcePageIndex[cit.source_page_id].push(claim.id);
          }
        }
      });
    });
  }

  // Normalize services - claim_ids come from index
  const services: NormalizedService[] = (raw.services || []).map((s: any) => {
    const id = s.service_id || s.id || '';
    const claim_ids = claimsByServiceIndex[id] || [];
    return {
      id,
      agency_id: s.agency_id || null,
      name: s.service_name || s.name || '',
      description: s.description || null,
      portal_url: s.portal_url || null,
      claim_ids,
      status: computeDerivedStatusFromClaims(claim_ids, claimsById),
    };
  });

  // Normalize documents
  const documents: NormalizedDocument[] = (raw.documents || []).map((d: any) => ({
    id: d.document_id || d.id || '',
    name: d.document_name || d.name || '',
    issuing_agency_id: d.issuing_agency_id || null,
  }));

  return {
    schema_version: raw.$schema_version || '2.0.0',
    agencies,
    services,
    claims,
    source_pages,
    documents,
  };
}

// Helper to extract domain from URL
function extractDomain(url: string | undefined): string {
  if (!url) return '';
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return '';
  }
}

// Compute derived status from claim IDs
function computeDerivedStatusFromClaims(
  claimIds: string[], 
  claimsById: Record<string, NormalizedClaim>
): DerivedStatus {
  if (claimIds.length === 0) return 'unverified';
  
  const statuses = claimIds
    .map(id => claimsById[id]?.status)
    .filter(Boolean) as ClaimStatus[];
  
  if (statuses.length === 0) return 'unverified';
  if (statuses.every(s => s === 'verified')) return 'verified';
  if (statuses.some(s => s === 'contradicted')) return 'contradicted';
  if (statuses.some(s => s === 'deprecated')) return 'deprecated';
  if (statuses.some(s => s === 'stale')) return 'stale';
  if (statuses.some(s => s === 'verified') && statuses.some(s => s !== 'verified')) return 'partial';
  
  return 'unverified';
}

// ============= NORMALIZED KB SINGLETON =============
const kb: NormalizedKB = normalizeKB(kbData);

// Build lookup maps for fast access
const agenciesById: Record<string, NormalizedAgency> = {};
kb.agencies.forEach(a => { agenciesById[a.id] = a; });

const servicesById: Record<string, NormalizedService> = {};
kb.services.forEach(s => { servicesById[s.id] = s; });

const claimsById: Record<string, NormalizedClaim> = {};
kb.claims.forEach(c => { claimsById[c.id] = c; });

const sourcePagesById: Record<string, NormalizedSourcePage> = {};
kb.source_pages.forEach(sp => { sourcePagesById[sp.id] = sp; });

const documentsById: Record<string, NormalizedDocument> = {};
kb.documents.forEach(d => { documentsById[d.id] = d; });

// ============= PUBLIC API =============

// Categories in display order
export const CATEGORY_ORDER: NormalizedCategory[] = [
  'eligibility',
  'fees',
  'required_documents',
  'processing_time',
  'application_steps',
  'portal_links',
  'service_info',
];

export const CATEGORY_LABELS: Record<NormalizedCategory, string> = {
  eligibility: 'Eligibility',
  fees: 'Fees',
  required_documents: 'Required Documents',
  processing_time: 'Processing Time',
  application_steps: 'Application Steps',
  portal_links: 'Portal Links',
  service_info: 'Service Information',
};

export const CATEGORY_ICONS: Record<NormalizedCategory, string> = {
  eligibility: '👤',
  fees: '💰',
  required_documents: '📄',
  processing_time: '⏱️',
  application_steps: '📋',
  portal_links: '🔗',
  service_info: 'ℹ️',
};

// Stats
export function getStats() {
  const statusCounts = kb.claims.reduce((acc, claim) => {
    acc[claim.status] = (acc[claim.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    agencies: kb.agencies.length,
    services: kb.services.length,
    claims: kb.claims.length,
    sourcepages: kb.source_pages.length,
    documents: kb.documents.length,
    statusBreakdown: statusCounts,
  };
}

// Agencies
export function listAgencies(): NormalizedAgency[] {
  return kb.agencies;
}

export function getAgencyById(id: string): NormalizedAgency | undefined {
  return agenciesById[id];
}

// Services
export interface ServiceFilters {
  agency_id?: string;
  status?: DerivedStatus;
  domain?: string;
  onlyVerified?: boolean;
  search?: string;
}

export function listServices(filters?: ServiceFilters): NormalizedService[] {
  let services = [...kb.services];

  if (filters?.agency_id) {
    services = services.filter(s => s.agency_id === filters.agency_id);
  }

  if (filters?.status) {
    services = services.filter(s => s.status === filters.status);
  }

  if (filters?.onlyVerified) {
    services = services.filter(s => s.status === 'verified');
  }

  if (filters?.search) {
    const q = filters.search.toLowerCase();
    services = services.filter(s => 
      s.name.toLowerCase().includes(q) || 
      (s.description || '').toLowerCase().includes(q)
    );
  }

  if (filters?.domain) {
    services = services.filter(svc => {
      return svc.claim_ids.some(claimId => {
        const claim = claimsById[claimId];
        if (!claim) return false;
        return claim.citations.some(cit => {
          const srcPage = sourcePagesById[cit.source_page_id];
          return srcPage?.domain === filters.domain;
        });
      });
    });
  }

  return services;
}

export function getServiceById(id: string): NormalizedService | undefined {
  return servicesById[id];
}

// Claims
export interface ClaimFilters {
  status?: ClaimStatus;
  service_id?: string;
  agency_id?: string;
  domain?: string;
  category?: NormalizedCategory;
  search?: string;
}

export function listClaims(filters?: ClaimFilters): NormalizedClaim[] {
  let claims = [...kb.claims];

  if (filters?.status) {
    claims = claims.filter(c => c.status === filters.status);
  }

  if (filters?.category) {
    claims = claims.filter(c => c.category === filters.category);
  }

  if (filters?.service_id) {
    const serviceClaimIds = claimsByServiceIndex[filters.service_id] || [];
    claims = claims.filter(c => serviceClaimIds.includes(c.id));
  }

  if (filters?.agency_id) {
    const agencyServices = kb.services.filter(s => s.agency_id === filters.agency_id);
    const agencyClaimIds = new Set(agencyServices.flatMap(s => s.claim_ids));
    claims = claims.filter(c => agencyClaimIds.has(c.id));
  }

  if (filters?.domain) {
    claims = claims.filter(c => 
      c.citations.some(cit => {
        const srcPage = sourcePagesById[cit.source_page_id];
        return srcPage?.domain === filters.domain;
      })
    );
  }

  if (filters?.search) {
    const q = filters.search.toLowerCase();
    claims = claims.filter(c => 
      c.text.toLowerCase().includes(q) || 
      (c.summary?.toLowerCase().includes(q))
    );
  }

  return claims;
}

export function getClaimById(id: string): NormalizedClaim | undefined {
  return claimsById[id];
}

export function getClaimsByService(serviceId: string): NormalizedClaim[] {
  const claimIds = claimsByServiceIndex[serviceId] || [];
  return claimIds.map(id => claimsById[id]).filter(Boolean) as NormalizedClaim[];
}

export function getClaimsBySourcePage(sourcePageId: string): NormalizedClaim[] {
  const claimIds = claimsBySourcePageIndex[sourcePageId] || [];
  return claimIds.map(id => claimsById[id]).filter(Boolean) as NormalizedClaim[];
}

// Source Pages
export interface SourcePageFilters {
  domain?: string;
  hasStaleClaims?: boolean;
  hasVerifiedClaims?: boolean;
  search?: string;
}

export function listSourcePages(filters?: SourcePageFilters): NormalizedSourcePage[] {
  let pages = [...kb.source_pages];

  if (filters?.domain) {
    pages = pages.filter(p => p.domain === filters.domain);
  }

  if (filters?.search) {
    const q = filters.search.toLowerCase();
    pages = pages.filter(p => 
      p.canonical_url.toLowerCase().includes(q) || 
      p.domain.toLowerCase().includes(q)
    );
  }

  if (filters?.hasStaleClaims) {
    pages = pages.filter(p => {
      const claims = getClaimsBySourcePage(p.id);
      return claims.some(c => c.status === 'stale');
    });
  }

  if (filters?.hasVerifiedClaims) {
    pages = pages.filter(p => {
      const claims = getClaimsBySourcePage(p.id);
      return claims.some(c => c.status === 'verified');
    });
  }

  return pages;
}

export function getSourcePageById(id: string): NormalizedSourcePage | undefined {
  return sourcePagesById[id];
}

// Documents
export function listDocuments(): NormalizedDocument[] {
  return kb.documents;
}

export function getDocumentById(id: string): NormalizedDocument | undefined {
  return documentsById[id];
}

// Get services referencing a claim
export function getServicesReferencingClaim(claimId: string): NormalizedService[] {
  return kb.services.filter(s => s.claim_ids.includes(claimId));
}

// Get unique domains
export function getUniqueDomains(): string[] {
  return [...new Set(kb.source_pages.map(p => p.domain).filter(Boolean))];
}

// Global search
export interface SearchResult {
  type: 'service' | 'claim' | 'source';
  id: string;
  title: string;
  subtitle: string;
  status?: DerivedStatus;
}

export function globalSearch(query: string): SearchResult[] {
  const q = query.toLowerCase();
  const results: SearchResult[] = [];

  // Search services
  kb.services.forEach(svc => {
    if (svc.name.toLowerCase().includes(q) || (svc.description || '').toLowerCase().includes(q)) {
      results.push({
        type: 'service',
        id: svc.id,
        title: svc.name,
        subtitle: svc.description || '',
        status: svc.status,
      });
    }
  });

  // Search claims
  kb.claims.forEach(claim => {
    if (claim.text.toLowerCase().includes(q) || claim.summary?.toLowerCase().includes(q)) {
      results.push({
        type: 'claim',
        id: claim.id,
        title: claim.summary || claim.id,
        subtitle: claim.text.substring(0, 100),
        status: claim.status,
      });
    }
  });

  // Search source pages
  kb.source_pages.forEach(src => {
    if (src.canonical_url.toLowerCase().includes(q) || src.domain.toLowerCase().includes(q)) {
      results.push({
        type: 'source',
        id: src.id,
        title: src.domain || src.canonical_url,
        subtitle: src.canonical_url,
      });
    }
  });

  return results.slice(0, 20);
}

// Export for legacy compatibility
export type { NormalizedClaim as Claim };
export type { NormalizedService as Service };
export type { NormalizedAgency as Agency };
export type { NormalizedSourcePage as SourcePage };
export type { NormalizedDocument as Document };
