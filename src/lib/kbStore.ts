import kbData from '@/data/kb.json';

// Type definitions
export interface Agency {
  id: string;
  name: string;
  short_name: string;
  website: string;
}

export interface SourcePage {
  id: string;
  canonical_url: string;
  domain: string;
  fetched_at: string;
  content_hash: string;
  snapshot_ref: string;
}

export interface Citation {
  source_page_id: string;
  locator: string;
}

export type ClaimStatus = 'verified' | 'unverified' | 'stale' | 'deprecated' | 'contradicted';
export type ClaimCategory = 'eligibility' | 'fees' | 'required_documents' | 'processing_time' | 'application_steps' | 'portal_links';

export interface Claim {
  id: string;
  category: ClaimCategory;
  text: string;
  summary?: string;
  status: ClaimStatus;
  verified_at?: string;
  verified_by?: string;
  verification_notes?: string;
  stale_marked_at?: string;
  stale_due_to_source_hash?: boolean;
  previous_status?: ClaimStatus;
  deprecated_at?: string;
  deprecated_reason?: string;
  citations: Citation[];
}

export interface Service {
  id: string;
  name: string;
  agency_id: string;
  description: string;
  portal_url?: string;
  claim_ids: string[];
  status?: ClaimStatus | 'partial';
}

export interface Document {
  id: string;
  name: string;
  issuing_agency_id: string;
}

export interface KBData {
  $schema_version: string;
  agencies: Agency[];
  source_pages: SourcePage[];
  claims: Claim[];
  services: Service[];
  documents: Document[];
}

// Try to load indexes, fallback to computing
let claimsByServiceIndex: Record<string, string[]> = {};
let claimsBySourcePageIndex: Record<string, string[]> = {};

try {
  claimsByServiceIndex = require('@/data/indexes/claims_by_service.json');
} catch {
  // Compute from data
  (kbData as KBData).services.forEach(svc => {
    claimsByServiceIndex[svc.id] = svc.claim_ids || [];
  });
}

try {
  claimsBySourcePageIndex = require('@/data/indexes/claims_by_source_page.json');
} catch {
  // Compute from data
  (kbData as KBData).claims.forEach(claim => {
    claim.citations.forEach(cit => {
      if (!claimsBySourcePageIndex[cit.source_page_id]) {
        claimsBySourcePageIndex[cit.source_page_id] = [];
      }
      if (!claimsBySourcePageIndex[cit.source_page_id].includes(claim.id)) {
        claimsBySourcePageIndex[cit.source_page_id].push(claim.id);
      }
    });
  });
}

const kb = kbData as KBData;

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
  const claims = kb.claims;
  const statusCounts = claims.reduce((acc, claim) => {
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
export function listAgencies(): Agency[] {
  return kb.agencies;
}

export function getAgencyById(id: string): Agency | undefined {
  return kb.agencies.find(a => a.id === id);
}

// Services
export interface ServiceFilters {
  agency_id?: string;
  status?: ClaimStatus | 'partial';
  domain?: string;
  onlyVerified?: boolean;
  search?: string;
}

export function listServices(filters?: ServiceFilters): Service[] {
  let services = kb.services.map(svc => ({
    ...svc,
    status: svc.status || computeDerivedStatus(svc.claim_ids),
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
      s.description.toLowerCase().includes(q)
    );
  }

  if (filters?.domain) {
    services = services.filter(svc => {
      const claimIds = svc.claim_ids;
      return claimIds.some(claimId => {
        const claim = getClaimById(claimId);
        if (!claim) return false;
        return claim.citations.some(cit => {
          const srcPage = getSourcePageById(cit.source_page_id);
          return srcPage?.domain === filters.domain;
        });
      });
    });
  }

  return services;
}

export function getServiceById(id: string): (Service & { status: ClaimStatus | 'partial' }) | undefined {
  const svc = kb.services.find(s => s.id === id);
  if (!svc) return undefined;
  return {
    ...svc,
    status: svc.status || computeDerivedStatus(svc.claim_ids),
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
  return kb.claims.find(c => c.id === id);
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

export function getSourcePageById(id: string): SourcePage | undefined {
  return kb.source_pages.find(p => p.id === id);
}

// Documents
export function listDocuments(): Document[] {
  return kb.documents;
}

export function getDocumentById(id: string): Document | undefined {
  return kb.documents.find(d => d.id === id);
}

// Get services referencing a claim
export function getServicesReferencingClaim(claimId: string): Service[] {
  return kb.services.filter(s => s.claim_ids.includes(claimId));
}

// Get unique domains
export function getUniqueDomains(): string[] {
  return [...new Set(kb.source_pages.map(p => p.domain))];
}

// Get all claim categories
export function getClaimCategories(): ClaimCategory[] {
  return ['eligibility', 'fees', 'required_documents', 'processing_time', 'application_steps', 'portal_links'];
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
  kb.services.forEach(svc => {
    if (svc.name.toLowerCase().includes(q) || svc.description.toLowerCase().includes(q)) {
      results.push({
        type: 'service',
        id: svc.id,
        title: svc.name,
        subtitle: svc.description,
        status: computeDerivedStatus(svc.claim_ids),
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
        title: src.domain,
        subtitle: src.canonical_url,
      });
    }
  });

  return results.slice(0, 20);
}
