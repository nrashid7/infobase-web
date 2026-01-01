import kbData from '@/data/kb.json';

// Type definitions - flexible to match real KB JSON structure
export interface Agency {
  agency_id?: string;
  id?: string;
  name: string;
  short_name?: string;
  website?: string;
  domain_allowlist?: string[];
  claims?: string[];
}

export interface SourcePage {
  source_page_id?: string;
  id?: string;
  canonical_url: string;
  domain?: string;
  agency_id?: string;
  page_type?: string;
  title?: string;
  language?: string[];
  crawl_method?: string;
  last_crawled_at?: string;
  fetched_at?: string;
  content_hash?: string;
  snapshot_ref?: string;
  status?: string;
  change_log?: any[];
}

export interface Citation {
  source_page_id: string;
  locator?: any;
  quoted_text?: string;
  retrieved_at?: string;
  language?: string;
}

export type ClaimStatus = 'verified' | 'unverified' | 'stale' | 'deprecated' | 'contradicted';
export type ClaimCategory = 'eligibility' | 'fees' | 'required_documents' | 'processing_time' | 'application_steps' | 'portal_links' | 'step' | 'fee' | 'service_info' | 'operational_info';

export interface Claim {
  claim_id?: string;
  id?: string;
  entity_ref?: { type: string; id: string };
  claim_type?: string;
  category?: ClaimCategory;
  text: string;
  summary?: string;
  status: ClaimStatus;
  structured_data?: any;
  verified_at?: string;
  verified_by?: string;
  verification_notes?: string;
  last_verified_at?: string;
  stale_marked_at?: string;
  stale_due_to_source_hash?: boolean;
  previous_status?: ClaimStatus;
  deprecated_at?: string;
  deprecated_reason?: string;
  citations: Citation[];
  tags?: string[];
}

export interface Service {
  service_id?: string;
  id?: string;
  name?: string;
  service_name?: string;
  agency_id?: string;
  description?: string;
  portal_url?: string;
  claim_ids?: string[];
  claims?: string[];
  portal_mapping?: any;
  official_entrypoints?: any[];
  status?: ClaimStatus | 'partial';
}

export interface Document {
  document_id?: string;
  id?: string;
  name?: string;
  document_name?: string;
  issuing_agency_id?: string;
}

export interface KBData {
  $schema_version: string;
  data_version?: number;
  last_updated_at?: string;
  updated_by?: string;
  change_log?: any[];
  agencies: Agency[];
  source_pages: SourcePage[];
  claims: Claim[];
  services: Service[];
  documents?: Document[];
}

// Helper to get ID from various formats
export const getId = (obj: any): string => obj.id || obj.service_id || obj.agency_id || obj.source_page_id || obj.claim_id || obj.document_id || '';
export const getName = (obj: any): string => obj.name || obj.service_name || obj.document_name || '';
export const getClaimIds = (svc: Service): string[] => svc.claim_ids || svc.claims || [];

// Cast data safely
const kb = kbData as unknown as KBData;

// Try to load indexes, fallback to computing
let claimsByServiceIndex: Record<string, string[]> = {};
let claimsBySourcePageIndex: Record<string, string[]> = {};

try {
  claimsByServiceIndex = require('@/data/indexes/claims_by_service.json');
} catch {
  // Compute from data
  kb.services?.forEach(svc => {
    const svcId = getId(svc);
    claimsByServiceIndex[svcId] = getClaimIds(svc);
  });
}

try {
  claimsBySourcePageIndex = require('@/data/indexes/claims_by_source_page.json');
} catch {
  // Compute from data
  kb.claims?.forEach(claim => {
    const claimId = getId(claim);
    claim.citations?.forEach(cit => {
      if (!claimsBySourcePageIndex[cit.source_page_id]) {
        claimsBySourcePageIndex[cit.source_page_id] = [];
      }
      if (!claimsBySourcePageIndex[cit.source_page_id].includes(claimId)) {
        claimsBySourcePageIndex[cit.source_page_id].push(claimId);
      }
    });
  });
}

// Helper: Compute derived status for a service based on its claims
export function computeDerivedStatus(claimIds: string[]): ClaimStatus | 'partial' {
  const claims = claimIds.map(id => getClaimById(id)).filter(Boolean) as Claim[];
  
  if (claims.length === 0) return 'unverified';
  
  const statuses = claims.map(c => c.status);
  
  if (statuses.every(s => s === 'verified')) return 'verified';
  if (statuses.some(s => s === 'contradicted')) return 'contradicted';
  if (statuses.some(s => s === 'deprecated')) return 'deprecated';
  if (statuses.some(s => s === 'stale')) return 'stale';
  if (statuses.some(s => s === 'verified') && statuses.some(s => s !== 'verified')) return 'partial';
  
  return 'unverified';
}

// Stats
export function getStats() {
  const claims = kb.claims || [];
  const statusCounts = claims.reduce((acc, claim) => {
    acc[claim.status] = (acc[claim.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    agencies: (kb.agencies || []).length,
    services: (kb.services || []).length,
    claims: (kb.claims || []).length,
    sourcepages: (kb.source_pages || []).length,
    documents: (kb.documents || []).length,
    statusBreakdown: statusCounts,
  };
}

// Agencies
export function listAgencies(): Agency[] {
  return kb.agencies || [];
}

export function getAgencyById(id: string): Agency | undefined {
  return (kb.agencies || []).find(a => getId(a) === id);
}

// Services
export interface ServiceFilters {
  agency_id?: string;
  status?: ClaimStatus | 'partial';
  domain?: string;
  onlyVerified?: boolean;
  search?: string;
}

export function listServices(filters?: ServiceFilters): (Service & { name: string; status: ClaimStatus | 'partial' })[] {
  let services = (kb.services || []).map(svc => ({
    ...svc,
    name: getName(svc),
    status: svc.status || computeDerivedStatus(getClaimIds(svc)),
  }));

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
      const claimIds = getClaimIds(svc);
      return claimIds.some(claimId => {
        const claim = getClaimById(claimId);
        if (!claim) return false;
        return (claim.citations || []).some(cit => {
          const srcPage = getSourcePageById(cit.source_page_id);
          return srcPage?.domain === filters.domain;
        });
      });
    });
  }

  return services;
}

export function getServiceById(id: string): (Service & { name: string; status: ClaimStatus | 'partial' }) | undefined {
  const svc = (kb.services || []).find(s => getId(s) === id);
  if (!svc) return undefined;
  return {
    ...svc,
    name: getName(svc),
    status: svc.status || computeDerivedStatus(getClaimIds(svc)),
  };
}

// Claims
export interface ClaimFilters {
  status?: ClaimStatus;
  service_id?: string;
  agency_id?: string;
  domain?: string;
  category?: ClaimCategory;
  search?: string;
}

export function listClaims(filters?: ClaimFilters): Claim[] {
  let claims = [...(kb.claims || [])];

  if (filters?.status) {
    claims = claims.filter(c => c.status === filters.status);
  }

  if (filters?.category) {
    claims = claims.filter(c => c.category === filters.category || c.claim_type === filters.category);
  }

  if (filters?.service_id) {
    const serviceClaimIds = claimsByServiceIndex[filters.service_id] || [];
    claims = claims.filter(c => serviceClaimIds.includes(getId(c)));
  }

  if (filters?.agency_id) {
    const agencyServices = (kb.services || []).filter(s => s.agency_id === filters.agency_id);
    const agencyClaimIds = new Set(agencyServices.flatMap(s => getClaimIds(s)));
    claims = claims.filter(c => agencyClaimIds.has(getId(c)));
  }

  if (filters?.domain) {
    claims = claims.filter(c => 
      (c.citations || []).some(cit => {
        const srcPage = getSourcePageById(cit.source_page_id);
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

export function getClaimById(id: string): Claim | undefined {
  return (kb.claims || []).find(c => getId(c) === id);
}

export function getClaimsByService(serviceId: string): Claim[] {
  const claimIds = claimsByServiceIndex[serviceId] || [];
  return claimIds.map(id => getClaimById(id)).filter(Boolean) as Claim[];
}

export function getClaimsBySourcePage(sourcePageId: string): Claim[] {
  const claimIds = claimsBySourcePageIndex[sourcePageId] || [];
  return claimIds.map(id => getClaimById(id)).filter(Boolean) as Claim[];
}

// Source Pages
export interface SourcePageFilters {
  domain?: string;
  hasStaleClaims?: boolean;
  hasVerifiedClaims?: boolean;
  search?: string;
}

export function listSourcePages(filters?: SourcePageFilters): SourcePage[] {
  let pages = [...(kb.source_pages || [])];

  if (filters?.domain) {
    pages = pages.filter(p => p.domain === filters.domain);
  }

  if (filters?.search) {
    const q = filters.search.toLowerCase();
    pages = pages.filter(p => 
      p.canonical_url.toLowerCase().includes(q) || 
      (p.domain || '').toLowerCase().includes(q)
    );
  }

  if (filters?.hasStaleClaims) {
    pages = pages.filter(p => {
      const claims = getClaimsBySourcePage(getId(p));
      return claims.some(c => c.status === 'stale');
    });
  }

  if (filters?.hasVerifiedClaims) {
    pages = pages.filter(p => {
      const claims = getClaimsBySourcePage(getId(p));
      return claims.some(c => c.status === 'verified');
    });
  }

  return pages;
}

export function getSourcePageById(id: string): SourcePage | undefined {
  return (kb.source_pages || []).find(p => getId(p) === id);
}

// Documents
export function listDocuments(): Document[] {
  return kb.documents || [];
}

export function getDocumentById(id: string): Document | undefined {
  return (kb.documents || []).find(d => getId(d) === id);
}

// Get services referencing a claim
export function getServicesReferencingClaim(claimId: string): Service[] {
  return (kb.services || []).filter(s => getClaimIds(s).includes(claimId));
}

// Get unique domains
export function getUniqueDomains(): string[] {
  return [...new Set((kb.source_pages || []).map(p => p.domain).filter(Boolean))] as string[];
}

// Get all claim categories
export function getClaimCategories(): ClaimCategory[] {
  return ['eligibility', 'fees', 'required_documents', 'processing_time', 'application_steps', 'portal_links', 'step', 'fee', 'service_info', 'operational_info'];
}

// Global search
export interface SearchResult {
  type: 'service' | 'claim' | 'source';
  id: string;
  title: string;
  subtitle: string;
  status?: ClaimStatus | 'partial';
}

export function globalSearch(query: string): SearchResult[] {
  const q = query.toLowerCase();
  const results: SearchResult[] = [];

  // Search services
  (kb.services || []).forEach(svc => {
    const name = getName(svc);
    const desc = svc.description || '';
    if (name.toLowerCase().includes(q) || desc.toLowerCase().includes(q)) {
      results.push({
        type: 'service',
        id: getId(svc),
        title: name,
        subtitle: desc,
        status: computeDerivedStatus(getClaimIds(svc)),
      });
    }
  });

  // Search claims
  (kb.claims || []).forEach(claim => {
    if (claim.text.toLowerCase().includes(q) || claim.summary?.toLowerCase().includes(q)) {
      results.push({
        type: 'claim',
        id: getId(claim),
        title: claim.summary || getId(claim),
        subtitle: claim.text.substring(0, 100),
        status: claim.status,
      });
    }
  });

  // Search source pages
  (kb.source_pages || []).forEach(src => {
    if (src.canonical_url.toLowerCase().includes(q) || (src.domain || '').toLowerCase().includes(q)) {
      results.push({
        type: 'source',
        id: getId(src),
        title: src.domain || src.canonical_url,
        subtitle: src.canonical_url,
      });
    }
  });

  return results.slice(0, 20);
}
