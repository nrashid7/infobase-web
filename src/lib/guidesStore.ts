// Typed data layer for published guides
// Local-first with optional remote fetching via env flags

// Static imports as primary data source
import localGuidesData from '@/data/public_guides.json';
import localIndexData from '@/data/public_guides_index.json';

// Remote fetching configuration (optional, controlled by env)
// Set VITE_USE_REMOTE_GUIDES=true and VITE_GUIDE_DATA_URL to enable
const USE_REMOTE = import.meta.env.VITE_USE_REMOTE_GUIDES === 'true';
const GUIDE_DATA_URL = import.meta.env.VITE_GUIDE_DATA_URL || '';
const INDEX_DATA_URL = import.meta.env.VITE_INDEX_DATA_URL || '';

// Cache configuration
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes
const CACHE_KEY_GUIDES = 'infobase_guides_cache';
const CACHE_KEY_INDEX = 'infobase_index_cache';

// Types
export interface Locator {
  type?: string;
  heading_path?: string[];
  selector?: string;
}

export interface Citation {
  source_page_id: string;
  canonical_url: string;
  domain: string;
  page_title?: string;
  locator: string | Locator;
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

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

// State
let guides: Guide[] = [];
let index: GuideIndexEntry[] = [];
let guideById: Map<string, Guide> = new Map();
let agencies: Array<{ id: string; name: string }> = [];
let officialDomains: Map<string, { domain: string; urls: Set<string>; titles: Set<string> }> = new Map();
let generatedAt: string | null = null;
let initialized = false;
let initPromise: Promise<void> | null = null;

/**
 * Format a locator for display. Handles string or object locators.
 */
export function formatLocator(locator: string | Locator | unknown): string {
  if (!locator) return '';
  
  // String locators - use directly
  if (typeof locator === 'string') return locator;
  
  // Object locators
  if (typeof locator === 'object' && locator !== null) {
    const loc = locator as Locator;
    const parts: string[] = [];
    
    // Join heading_path with " > "
    if (loc.heading_path && Array.isArray(loc.heading_path)) {
      parts.push(loc.heading_path.join(' > '));
    }
    
    // Add selector if present
    if (loc.selector && typeof loc.selector === 'string') {
      parts.push(loc.selector);
    }
    
    if (parts.length > 0) {
      return parts.join(' | ');
    }
    
    // Fallback for other object shapes
    if (loc.type && typeof loc.type === 'string') {
      return loc.type;
    }
    
    return '[structured locator]';
  }
  
  return '';
}

/**
 * Get from localStorage cache if valid
 */
function getFromCache<T>(key: string): T | null {
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;
    
    const entry: CacheEntry<T> = JSON.parse(cached);
    const now = Date.now();
    
    if (now - entry.timestamp < CACHE_TTL_MS) {
      return entry.data;
    }
    
    // Cache expired, remove it
    localStorage.removeItem(key);
    return null;
  } catch {
    return null;
  }
}

/**
 * Save to localStorage cache
 */
function saveToCache<T>(key: string, data: T): void {
  try {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now()
    };
    localStorage.setItem(key, JSON.stringify(entry));
  } catch {
    // localStorage full or unavailable, ignore
  }
}

/**
 * Fetch with timeout
 */
async function fetchWithTimeout(url: string, timeoutMs = 5000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, { signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Try to fetch remote data if enabled, otherwise use local
 * Does not block on remote - returns local immediately if remote disabled or fails
 */
async function loadDataWithOptionalRemote<T>(
  remoteUrl: string, 
  cacheKey: string, 
  localFallback: T
): Promise<T> {
  // If remote fetching is disabled or no URL, use local data
  if (!USE_REMOTE || !remoteUrl) {
    return localFallback;
  }

  // Check cache first
  const cached = getFromCache<T>(cacheKey);
  if (cached) {
    return cached;
  }
  
  // Try remote fetch
  try {
    const response = await fetchWithTimeout(remoteUrl);
    if (response.ok) {
      const data = await response.json() as T;
      saveToCache(cacheKey, data);
      return data;
    }
  } catch {
    // Remote fetch failed, silently fall back
  }
  
  // Fallback to local bundled data
  return localFallback;
}

/**
 * Build internal lookup structures
 */
function buildLookups(): void {
  // Build guide lookup map
  guideById = new Map<string, Guide>();
  guides.forEach(g => {
    guideById.set(g.guide_id, g);
    // Also index by service_id for backwards compat
    guideById.set(g.service_id, g);
  });

  // Extract unique agencies
  const agencyMap = new Map<string, { id: string; name: string }>();
  guides.forEach(g => {
    if (!agencyMap.has(g.agency_id)) {
      agencyMap.set(g.agency_id, { id: g.agency_id, name: g.agency_name });
    }
  });
  agencies = Array.from(agencyMap.values());

  // Extract unique official domains
  officialDomains = new Map<string, { domain: string; urls: Set<string>; titles: Set<string> }>();
  guides.forEach(g => {
    g.official_links?.forEach(link => {
      try {
        const url = new URL(link.url);
        const domain = url.hostname;
        if (!officialDomains.has(domain)) {
          officialDomains.set(domain, { domain, urls: new Set<string>(), titles: new Set<string>() });
        }
        const entry = officialDomains.get(domain)!;
        entry.urls.add(link.url);
        if (link.label) entry.titles.add(link.label);
      } catch {
        // Invalid URL, skip
      }
    });
  });
}

/**
 * Initialize with local data synchronously (for SSR/initial render)
 */
function initializeSync(): void {
  if (initialized) return;
  
  guides = (localGuidesData as GuidesData).guides;
  index = (localIndexData as IndexData).entries;
  generatedAt = (localGuidesData as GuidesData).generated_at || null;
  buildLookups();
  initialized = true;
}

/**
 * Initialize data - local-first, with optional remote upgrade
 */
export async function initializeGuides(): Promise<void> {
  if (initPromise) return initPromise;
  
  // Start with local data immediately (non-blocking)
  initializeSync();
  
  // Only attempt remote fetch if enabled via env
  if (!USE_REMOTE) {
    initPromise = Promise.resolve();
    return initPromise;
  }
  
  // Try to upgrade to remote data in background
  initPromise = (async () => {
    try {
      const [remoteGuides, remoteIndex] = await Promise.all([
        loadDataWithOptionalRemote<GuidesData>(GUIDE_DATA_URL, CACHE_KEY_GUIDES, localGuidesData as GuidesData),
        loadDataWithOptionalRemote<IndexData>(INDEX_DATA_URL, CACHE_KEY_INDEX, localIndexData as IndexData)
      ]);
      
      guides = remoteGuides.guides;
      index = remoteIndex.entries;
      generatedAt = remoteGuides.generated_at || null;
      buildLookups();
    } catch {
      // Keep using local data, already initialized
    }
  })();
  
  return initPromise;
}

// Initialize synchronously with local data for immediate use
initializeSync();

// Optionally start async remote fetch in background (only if enabled)
if (typeof window !== 'undefined' && USE_REMOTE) {
  initializeGuides().catch(() => {
    // Silent fail, we have local data
  });
}

/**
 * List all guides with optional search and agency filtering
 */
export function listGuides(options?: { search?: string; agency?: string; category?: string }): GuideIndexEntry[] {
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

  if (options?.category) {
    const catLower = options.category.toLowerCase();
    results = results.filter(g =>
      g.keywords.some(k => k.toLowerCase().includes(catLower))
    );
  }
  
  return results;
}

/**
 * Get a single guide by slug/ID (accepts guide_id or service_id)
 */
export function getGuideBySlug(slug: string): Guide | undefined {
  return guideById.get(slug);
}

// Alias for backwards compatibility
export function getGuideById(id: string): Guide | undefined {
  return getGuideBySlug(id);
}

/**
 * Get guide statistics
 */
export function getStats(): { 
  guides: number; 
  agencies: number; 
  lastUpdated: string | null;
  totalCitations: number;
  officialDomains: number;
} {
  const totalCitations = guides.reduce((sum, g) => sum + (g.meta.total_citations || 0), 0);
  
  return {
    guides: guides.length,
    agencies: agencies.length,
    lastUpdated: generatedAt,
    totalCitations,
    officialDomains: officialDomains.size
  };
}

// Alias for backwards compatibility
export function getGuideStats() {
  return getStats();
}

/**
 * List all agencies
 */
export function listAgencies(): Array<{ id: string; name: string }> {
  return agencies;
}

/**
 * List official source domains
 */
export function listOfficialSources(): Array<{ domain: string; urls: string[]; titles: string[] }> {
  return Array.from(officialDomains.values()).map(d => ({
    domain: d.domain,
    urls: Array.from(d.urls),
    titles: Array.from(d.titles)
  }));
}

/**
 * Global search returning guides only (no claims)
 */
export function globalSearch(query: string): { guides: GuideIndexEntry[] } {
  if (!query || query.length < 2) {
    return { guides: [] };
  }
  return { guides: listGuides({ search: query }) };
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
 * Format citation for display (clean, no raw objects)
 */
export function formatCitation(citation: Citation): string {
  const parts: string[] = [];
  if (citation.domain) parts.push(citation.domain);
  
  const locatorStr = formatLocator(citation.locator);
  if (locatorStr) parts.push(locatorStr);
  
  return parts.join(' › ') || citation.canonical_url;
}
