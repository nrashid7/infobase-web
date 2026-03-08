# INFOBASE — Comprehensive Project Documentation

> **Last updated:** March 2026
> **Published URL:** [https://infobase.lovable.app](https://infobase.lovable.app)
> **Tech stack:** React 18 · Vite · TypeScript · Tailwind CSS · Supabase (Lovable Cloud)

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture Overview](#2-architecture-overview)
3. [Directory Structure](#3-directory-structure)
4. [Data Layer](#4-data-layer)
5. [Bilingual System](#5-bilingual-system)
6. [Backend Functions (Edge Functions)](#6-backend-functions-edge-functions)
7. [Database](#7-database)
8. [Key Components](#8-key-components)
9. [Pages](#9-pages)
10. [Performance Optimizations](#10-performance-optimizations)
11. [SEO](#11-seo)
12. [Environment & Secrets](#12-environment--secrets)
13. [Adding New Guides](#13-adding-new-guides)
14. [Adding New Directory Entries](#14-adding-new-directory-entries)
15. [Deployment](#15-deployment)
16. [Operations Runbook](#16-operations-runbook)

---

## 1. Project Overview

**INFOBASE** is a citizen-facing knowledge base for Bangladesh government services. It aggregates information from official government websites and presents it as clear, step-by-step guides with citations linking back to original sources.

### What it does

- **Service Guides** — Step-by-step how-to guides for government services (passport, NID, driving license, birth certificate, visa, TIN, land records, etc.) with fees, required documents, processing times, and variant-based pricing.
- **Government Directory** — A curated directory of 700+ official Bangladesh government websites organized into 21 categories, with scraped details (description, contact info, services, office hours).
- **AI-powered Q&A** — A conversational search feature that uses Gemini 2.5 Flash to answer questions about government services using injected context from guides and the directory.
- **Bilingual support** — Full English and Bengali (বাংলা) language toggle for all UI text, guide content, and directory names.

### Key principles

- **Unofficial** — INFOBASE is not affiliated with any government agency. A disclaimer appears throughout the app.
- **Citation-first** — Every piece of information in a guide links to an official source. Users can verify claims on the original government portal.
- **Local-first data** — Guide data is bundled as JSON in the build. No network request is needed to render guides. Optional remote fetching can be enabled via env vars.

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React SPA)                     │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │ guidesStore   │  │ govDirectory │  │ LanguageContext         │ │
│  │ (local JSON)  │  │ (static TS)  │  │ (en/bn toggle)         │ │
│  └──────┬───────┘  └──────┬───────┘  └────────────┬───────────┘ │
│         │                 │                       │             │
│  ┌──────▼─────────────────▼───────────────────────▼───────────┐ │
│  │                    React Pages                             │ │
│  │  Index · Guides · GuideDetail · Directory · SiteDetail     │ │
│  │  BulkScrape · About · NotFound                             │ │
│  └────────────────────────┬──────────────────────────────────┘ │
│                           │                                     │
└───────────────────────────┼─────────────────────────────────────┘
                            │ fetch()
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                  SUPABASE (Lovable Cloud)                        │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                    Edge Functions                          │  │
│  │                                                            │  │
│  │  ask              → AI Q&A (Gemini 2.5 Flash via gateway)  │  │
│  │  scrape-gov-site  → Firecrawl + direct fetch + Gemini      │  │
│  │  research-guide   → Firecrawl crawl + Gemini synthesis     │  │
│  │  validate-url     → Batch URL validation with concurrency  │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                    PostgreSQL                              │  │
│  │  gov_site_details (scraped website data, contact info,     │  │
│  │                    services, branding, scrape status)       │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                 │
│  External APIs:                                                 │
│  • ai.gateway.lovable.dev (Gemini 2.5 Flash)                   │
│  • api.firecrawl.dev (web scraping)                             │
│  • archive.org + Google Cache (unreachable-site fallback)       │
└─────────────────────────────────────────────────────────────────┘
```

### Data flow summary

1. **Guide data** is statically bundled as JSON files imported at build time. No API call needed to render guides.
2. **Directory data** is a static TypeScript array (`govDirectory`) of 700+ links. Scraped details for each site are fetched on-demand from the `gov_site_details` table via the Supabase JS client.
3. **AI Q&A** sends the user's question + context (guide titles + directory listings) to the `ask` edge function, which streams a response from the Lovable AI gateway (Gemini 2.5 Flash) via Server-Sent Events.
4. **Scraping** is triggered from the admin BulkScrape page. The `scrape-gov-site` edge function first tries Firecrawl Map+Extract, then falls back to Firecrawl scrape, direct fetch with HTTP/cache/archive recovery, and finally uses Gemini (via Lovable AI gateway) to extract structured JSON before upserting into `gov_site_details`.

---

## 3. Directory Structure

```
├── index.html                    # Pre-rendered HTML shell with LCP optimization
├── src/
│   ├── App.tsx                   # Routes, providers, lazy loading
│   ├── main.tsx                  # React entry point
│   ├── index.css                 # Tailwind base + design tokens + custom styles
│   ├── layouts/
│   │   └── MainLayout.tsx        # Header + AnimatePresence + Footer wrapper
│   ├── pages/
│   │   ├── Index.tsx             # Homepage (hero, stats, category chips, featured sites)
│   │   ├── Guides.tsx            # Guide listing with search/filter
│   │   ├── GuideDetail.tsx       # Individual guide (steps, fees, documents, citations)
│   │   ├── Directory.tsx         # Category grid → site list
│   │   ├── SiteDetail.tsx        # Individual site details (scraped data)
│   │   ├── BulkScrape.tsx        # Admin tool for batch scraping
│   │   ├── About.tsx             # FAQ, disclaimer, resources
│   │   ├── NotFound.tsx          # 404 page
│   │   └── ServicesRedirect.tsx  # Legacy /services/:id → /guides/:id redirect
│   ├── components/
│   │   ├── GlobalSearch.tsx      # AI chat modal with streaming
│   │   ├── Header.tsx            # Navigation bar
│   │   ├── Footer.tsx            # Site footer
│   │   ├── SEO.tsx               # Dynamic meta tags + JSON-LD
│   │   ├── FaviconImage.tsx      # Google favicon proxy with error caching
│   │   ├── MarkdownRenderer.tsx  # Markdown-to-React converter for AI responses
│   │   ├── LanguageToggle.tsx    # EN/BN language switch button
│   │   ├── Breadcrumbs.tsx       # Breadcrumb navigation
│   │   ├── ScrapeStatusBadge.tsx # Visual badge for scrape status
│   │   ├── PageTransition.tsx    # Framer Motion page transition wrapper
│   │   ├── WarningBanner.tsx     # Disclaimer banner
│   │   └── ui/                   # shadcn/ui component library
│   ├── lib/
│   │   ├── guidesStore.ts        # Guide data layer (types, lookups, language switching)
│   │   ├── LanguageContext.tsx    # React context for bilingual support
│   │   ├── api/
│   │   │   └── govSites.ts       # Helper functions for site slug generation, DB queries
│   │   └── utils.ts              # Tailwind cn() utility
│   ├── data/
│   │   ├── govDirectory.ts       # Static directory of 700+ government links
│   │   ├── govBranding.ts        # Category colors, contact validation helpers
│   │   ├── public_guides.json    # English guide data (full)
│   │   ├── public_guides_bn.json # Bengali guide data (full)
│   │   ├── public_guides_index.json    # English guide index (lightweight)
│   │   └── public_guides_index_bn.json # Bengali guide index (lightweight)
│   ├── hooks/
│   │   ├── useScrapeStatus.ts    # Hook for scrape status polling
│   │   ├── useScrapeStatusFetch.ts # Deferred scrape stats fetcher
│   │   └── use-toast.ts          # Toast notification hook
│   └── integrations/
│       └── supabase/
│           ├── client.ts         # Auto-generated Supabase client (DO NOT EDIT)
│           └── types.ts          # Auto-generated database types (DO NOT EDIT)
├── supabase/
│   ├── config.toml               # Edge function configuration
│   └── functions/
│       ├── ask/index.ts          # AI Q&A endpoint
│       ├── scrape-gov-site/index.ts # Website scraping endpoint
│       ├── research-guide/index.ts  # Guide research endpoint
│       └── validate-url/index.ts    # URL validation endpoint
└── scripts/
    └── check-internal-ids.js     # Utility to validate guide IDs
```

---

## 4. Data Layer

### 4.1 `guidesStore.ts` — Guide Data Store

**Location:** `src/lib/guidesStore.ts`

This is the central data layer for all guide content. It manages:

- **Static imports** of JSON data files (English + Bengali)
- **Language switching** via `setGuidesLanguage(lang)`
- **Lookup maps** for O(1) guide retrieval by `guide_id` or `service_id`
- **Search** across titles, agency names, and keywords
- **Statistics** (guide count, agency count, citation count, official domains)

#### Key exports

| Function | Description |
|---|---|
| `initializeGuides()` | Async initializer. Loads local data synchronously, optionally fetches remote data if `VITE_USE_REMOTE_GUIDES=true`. |
| `setGuidesLanguage(lang)` | Switches the active dataset between English and Bengali. Called by `LanguageContext`. |
| `listGuides(options?)` | Returns `GuideIndexEntry[]` filtered by `search`, `agency`, or `category`. |
| `getGuideBySlug(slug)` | Returns a single `Guide` by `guide_id` or `service_id`. |
| `getGuideById(id)` | Alias for `getGuideBySlug`. |
| `getStats()` | Returns `{ guides, agencies, lastUpdated, totalCitations, officialDomains }`. |
| `listAgencies()` | Returns unique agencies `{ id, name }[]`. |
| `listOfficialSources()` | Returns official domains with their URLs and titles. |
| `globalSearch(query)` | Convenience wrapper returning `{ guides: GuideIndexEntry[] }`. |
| `getVariantTypes(guide)` | Extracts variant IDs (`regular`, `express`, `super_express`) from a guide. |
| `getFeesForVariant(guide, variantId?)` | Returns fees for a specific variant, falling back to general fees. |
| `formatCitation(citation)` | Formats a citation for display: `domain › locator`. |
| `formatLocator(locator)` | Handles string or object locators, joining heading paths with ` > `. |

#### Data flow

```
Build time:
  public_guides.json ──────┐
  public_guides_bn.json ───┤
  public_guides_index.json ┤──→ Static imports in guidesStore.ts
  public_guides_index_bn.json ┘
                                    │
Runtime:                            ▼
  initializeSync() ──→ guides[], index[], guideById Map, agencies[], officialDomains Map
                                    │
  setGuidesLanguage('bn') ──→ Swaps active dataset → Rebuilds all lookups
```

#### Type hierarchy

```typescript
Guide
├── guide_id: string
├── service_id: string
├── agency_id: string
├── agency_name: string
├── title: string
├── overview: string | null
├── steps: Step[]
│   ├── step_number: number
│   ├── title: string
│   ├── description: string
│   └── citations: Citation[]
│       ├── source_page_id: string
│       ├── canonical_url: string
│       ├── domain: string
│       ├── page_title: string
│       ├── locator: string | Locator
│       ├── quoted_text: string
│       ├── retrieved_at: string
│       └── language: string
├── sections: GuideSections
│   ├── application_steps: Step[]
│   ├── fees: FeeItem[]
│   ├── required_documents: SectionItem[]
│   ├── eligibility: SectionItem[]
│   ├── processing_time: SectionItem[]
│   ├── portal_links: SectionItem[]
│   └── service_info: SectionItem[]
├── variants: Variant[]
│   ├── variant_id: string ('regular' | 'express' | 'super_express')
│   ├── label: string
│   ├── fees: VariantFee[]
│   │   ├── text: string
│   │   ├── structured_data: { amount_bdt, pages, delivery_type, delivery_days }
│   │   └── citations: Citation[]
│   └── processing_times: { text, citations }[]
├── required_documents: SectionItem[]
├── fees: FeeItem[]
├── official_links: OfficialLink[]
│   ├── label: string
│   ├── url: string
│   └── source_page_id: string
└── meta: GuideMeta
    ├── total_steps: number
    ├── total_citations: number
    ├── verification_summary: { total, verified, unverified, stale, deprecated, contradicted }
    ├── last_crawled_at: string
    ├── source_domains: string[]
    ├── generated_at: string
    ├── last_updated_at: string
    └── status: string

GuideIndexEntry (lightweight, used for listing)
├── guide_id, service_id, agency_id
├── title, agency_name
├── keywords: string[]
├── step_count, citation_count
└── status: string
```

### 4.2 `govDirectory.ts` — Government Directory

**Location:** `src/data/govDirectory.ts`

A static TypeScript file containing a curated list of 700+ official Bangladesh government websites organized into 21 categories.

#### Structure

```typescript
interface DirectoryLink {
  name: string;       // English name
  nameBn?: string;    // Bengali name (optional)
  url: string;        // Official website URL
}

interface DirectoryCategory {
  id: string;         // e.g., 'core-government', 'key-ministries'
  name: string;       // English category name
  nameBn: string;     // Bengali category name
  links: DirectoryLink[];
}

export const govDirectory: DirectoryCategory[] = [ ... ];
```

#### Categories (21 total)

| ID | Name | Links |
|---|---|---|
| `core-government` | Core Government | ~15 |
| `key-ministries` | Key Ministries | ~25 |
| `public-services` | Public Services & Portals | ~20 |
| `e-governance` | e-Governance & Digital Services | ~15 |
| `law-judiciary` | Law & Judiciary | ~20 |
| ... | *(16 more categories)* | ... |

### 4.3 JSON Data Files

| File | Purpose | Size |
|---|---|---|
| `public_guides.json` | Full English guide data with all steps, citations, fees | Large |
| `public_guides_bn.json` | Full Bengali guide data (translated) | Large |
| `public_guides_index.json` | Lightweight English index for listing (no full content) | Small |
| `public_guides_index_bn.json` | Lightweight Bengali index for listing | Small |

Each JSON file follows this wrapper schema:

```json
{
  "$schema_version": "1.0",
  "generated_at": "2025-...",
  "source_kb_version": 3,
  "guides": [ ... ]   // or "entries": [ ... ] for index files
}
```

---

## 5. Bilingual System

INFOBASE supports English (`en`) and Bengali (`bn`) throughout the application.

### 5.1 `LanguageContext.tsx`

**Location:** `src/lib/LanguageContext.tsx`

Provides a React context with:

- `language` — current language (`'en'` or `'bn'`)
- `setLanguage(lang)` — switches language, persists to `localStorage`, updates `document.documentElement.lang`, and calls `setGuidesLanguage(lang)` to swap guide data
- `t(key)` — translation lookup function

#### Translation dictionary

The file contains ~130 translation keys covering:
- Navigation labels
- Homepage copy (title, subtitle, feature descriptions)
- Guide page labels (section headers, variant names, table headers)
- Empty states, search placeholders
- About page FAQ
- Footer disclaimer

#### How language switching works

```
User clicks language toggle
       │
       ▼
LanguageContext.setLanguage('bn')
       │
       ├──→ localStorage.setItem('language', 'bn')
       ├──→ document.documentElement.lang = 'bn'
       ├──→ guidesStore.setGuidesLanguage('bn')
       │         │
       │         ├──→ Swaps localGuidesData to bn version
       │         ├──→ Swaps localIndexData to bn version
       │         └──→ Rebuilds guideById Map, agencies[], etc.
       │
       └──→ React re-render (all components using useLanguage() update)
```

#### Initialization

On first load, the `LanguageProvider` reads `localStorage` for a saved preference. If it's `'bn'`, it immediately calls `setGuidesLanguage('bn')` before the first render:

```typescript
const [language, setLanguageState] = useState<Language>(() => {
  const saved = localStorage.getItem('language');
  const lang = (saved as Language) || 'en';
  if (lang !== 'en') setGuidesLanguage(lang);
  return lang;
});
```

### 5.2 Directory Bengali names

Each `DirectoryLink` in `govDirectory.ts` has an optional `nameBn` field. The Directory page renders:

```tsx
{language === 'bn' && link.nameBn ? link.nameBn : link.name}
```

This pattern provides graceful fallback — if `nameBn` is missing, English is shown.

### 5.3 Component-level translations

Most pages use inline Bengali/English via the `language` variable rather than the `t()` function for content that doesn't fit the translation dictionary pattern (e.g., dynamic category chip labels, greeting text):

```tsx
const greeting = language === 'bn' ? 'শুভ সকাল' : 'Good morning';
```

---

## 6. Backend Functions (Edge Functions)

All edge functions live in `supabase/functions/` and are auto-deployed when the project is published.

### 6.1 `ask` — AI-powered Q&A

**File:** `supabase/functions/ask/index.ts`
**Auth:** No JWT verification (`verify_jwt = false`)
**Method:** POST
**Response:** Server-Sent Events (SSE) stream

#### Request body

```json
{
  "question": "How do I apply for a passport?",
  "context": "=== SERVICE GUIDES ===\n...\n\n=== GOVERNMENT DIRECTORY ===\n...",
  "language": "en"
}
```

#### How it works

1. **Validates** input: question (required, max 1000 chars), context (max 50,000 chars), language (`en`/`bn`)
2. **Builds system prompt** with:
   - Language instruction (Bengali or English)
   - Data source description (guides + directory)
   - Guidelines for linking to guide pages (`/guides/GUIDE_ID`) and directory pages (`/directory/SLUG`)
   - The full context string (guide titles + directory listings injected by the frontend)
3. **Calls** the Lovable AI gateway (`https://ai.gateway.lovable.dev/v1/chat/completions`) with:
   - Model: `google/gemini-2.5-flash`
   - Streaming enabled
   - API key: `LOVABLE_API_KEY` (auto-provided secret)
4. **Proxies** the SSE stream back to the client
5. **Error handling:** 429 (rate limit), 402 (billing), 500 (server error)

#### Context injection

The frontend (`GlobalSearch.tsx`) builds the context string before sending:

```typescript
const guidesContext = guides.map(g => 
  `- ${g.title} (${g.agency_name}) [Guide ID: ${g.guide_id}]`
).join('\n');

const directoryContext = govDirectory.map(cat => {
  const sites = cat.links.map(l => 
    `- ${l.name} → ${l.url} [/directory/${getSiteSlug(l.url)}]`
  ).join('\n');
  return `Category: ${cat.name}\n${sites}`;
}).join('\n\n');
```

This gives the AI model awareness of all available guides and directory entries so it can link to them in its response.

#### CORS

All edge functions use the same CORS pattern:

```typescript
function isAllowedOrigin(origin: string): boolean {
  if (origin === 'http://localhost:5173' || origin === 'http://localhost:8080') return true;
  if (origin.endsWith('.lovable.app') || origin.endsWith('.lovableproject.com')) return true;
  return false;
}
```

### 6.2 `scrape-gov-site` — Multi-layered Website Scraper

**File:** `supabase/functions/scrape-gov-site/index.ts`
**Auth:** No JWT verification (called from admin BulkScrape page)
**Method:** POST
**Secrets required:** `FIRECRAWL_API_KEY`, `LOVABLE_API_KEY`

#### Request body

```json
{
  "url": "https://mof.gov.bd/",
  "name": "Ministry of Finance",
  "categoryId": "key-ministries"
}
```

#### Multi-layered scraping strategy

**Layer 1: Firecrawl** (3 attempts with different configs)

| Attempt | Formats | Wait | Fallback behavior |
|---|---|---|---|
| 1 | `markdown` + `branding` | 5s | Try next if < 500 chars |
| 2 | `markdown` only | 8s | Try next if < 500 chars |
| 3 | `rawHtml` | 10s | Extract text via regex, strip tags |

**Layer 2: Direct fetch fallback** (if Firecrawl insufficient)

Attempts direct server-side fetch from the edge function, then HTTP fallback, Google Cache, and Wayback snapshots for sites that are unreachable or blocked.

**Layer 3: Gemini JSON extraction** (structured extraction)

Takes the combined content and extracts structured JSON:

```json
{
  "description": "...",
  "mission": "...",
  "services": [{ "name": "...", "description": "..." }],
  "contact_info": { "phone": "...", "email": "...", "address": "...", "fax": "..." },
  "office_hours": "...",
  "related_links": [{ "title": "...", "url": "..." }]
}
```

**Layer 4: Branding extraction**

Extracts logo URL and primary color from Firecrawl's branding data. Falls back to category-specific colors (21 category colors defined).

**Layer 5: Contact cleaning**

The `cleanContactInfo()` function filters out placeholder values like "Not provided", "N/A", "coming soon", etc. Values shorter than 3 characters or matching invalid patterns are removed.

**Layer 6: Database upsert**

Upserts into `gov_site_details` with `onConflict: 'url'`.

#### Scrape status lifecycle

```
not in DB → upsert with status 'in_progress' → scraping → 'success' or 'failed'
```

### 6.3 `research-guide` — AI Guide Research

**File:** `supabase/functions/research-guide/index.ts`
**Auth:** `verify_jwt = false` in Supabase config, with explicit runtime auth check via `verifyAuth()`
**Method:** POST
**Secrets required:** `FIRECRAWL_API_KEY` (optional for crawl), `LOVABLE_API_KEY`

#### Request body

```json
{
  "guideId": "guide.epassport",
  "serviceName": "e-Passport Application",
  "agencyName": "Department of Immigration & Passports",
  "officialUrl": "https://epassport.gov.bd"
}
```

#### How it works

1. **Verifies auth in code** — requires a valid Supabase user session via `Authorization` header
2. **Crawls the official portal with Firecrawl** (main page + relevant sub-pages) when `officialUrl` is provided
3. **Calls Gemini via Lovable AI gateway** to synthesize comprehensive research content, prioritizing crawled official pages:
   - Step-by-step application process
   - Required documents
   - Fees (regular, express, super express)
   - Processing times
   - Eligibility requirements
   - Official portal URLs
4. **Calls Gemini again** to extract structured JSON from the synthesized research
5. **Builds** a full `GuideData` object with:
   - Steps with citations
   - Variants (regular/express/super_express) with fees and processing times
   - Required documents, eligibility, official links
   - Meta information (total steps, citations, source domains)

#### Citation building

Citations are constructed from crawled official page URLs:

```typescript
const buildCitation = (url: string, text?: string): Citation => ({
  source_page_id: `source.${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  canonical_url: url,
  domain: new URL(url).hostname,
  page_title: serviceName,
  locator: 'Official Portal Content',
  quoted_text: text || '',
  retrieved_at: now,
  language: 'en'
});
```

### 6.4 `validate-url` — Batch URL Validator

**File:** `supabase/functions/validate-url/index.ts`
**Auth:** No JWT verification
**Method:** POST

#### Request body

```json
{
  "entries": [
    { "url": "https://mof.gov.bd/", "name": "Ministry of Finance" },
    { "url": "https://mofa.gov.bd/", "name": "Ministry of Foreign Affairs" }
  ]
}
```

Also supports legacy format: `{ "urls": ["https://mof.gov.bd/"] }`

#### How it works

1. **Processes URLs with concurrency limit of 3**
2. For each URL:
   - Fetches with 10s timeout, follows redirects
   - Extracts `<title>` from HTML
   - Checks **content match**: verifies that at least 30% of significant words from `expectedName` appear in the page title
   - Handles SSL errors by trying HTTP fallback
   - Handles DNS failures, timeouts, connection refused
3. Returns per-URL results:

```json
{
  "results": {
    "https://mof.gov.bd/": {
      "valid": true,
      "status": 200,
      "pageTitle": "Ministry of Finance",
      "contentMatch": true,
      "finalUrl": "https://mof.gov.bd/"
    }
  }
}
```

#### Status outcomes

| Status | Meaning |
|---|---|
| `valid` | Site responds with HTTP < 500 |
| `invalid` | DNS failure, timeout, connection refused, or HTTP 5xx |
| `mismatch` | Site responds but page title doesn't match expected name |
| `redirect` | Site redirects to a different domain |
| `unknown` | Validation request itself failed |

---

## 7. Database

### `gov_site_details` table

| Column | Type | Description |
|---|---|---|
| `id` | uuid (PK) | Auto-generated |
| `url` | text (unique) | Official website URL |
| `name` | text | Organization name |
| `category_id` | text | Category from govDirectory (e.g., `core-government`) |
| `description` | text | Extracted description |
| `mission` | text | Mission statement |
| `services` | jsonb | Array of `{ name, description }` |
| `contact_info` | jsonb | `{ phone, email, address, fax }` |
| `office_hours` | text | Working hours |
| `related_links` | jsonb | Array of `{ title, url }` |
| `logo_url` | text | Logo URL from branding extraction |
| `primary_color` | text | Brand color (hex) |
| `scrape_status` | text | `in_progress`, `success`, `failed`, or null |
| `scrape_error` | text | Error message if scrape failed |
| `last_scraped_at` | timestamptz | When last scraped |
| `created_at` | timestamptz | Row creation time |
| `updated_at` | timestamptz | Last update time |

### Querying

The frontend queries this table via the auto-generated Supabase client:

```typescript
import { supabase } from '@/integrations/supabase/client';

// Get scraped details for a site
const { data } = await supabase
  .from('gov_site_details')
  .select('*')
  .eq('url', siteUrl)
  .single();

// Get scrape stats for homepage counter
const { data } = await supabase
  .from('gov_site_details')
  .select('scrape_status');
```

---

## 8. Key Components

### 8.1 `GlobalSearch` — AI Chat Modal

**File:** `src/components/GlobalSearch.tsx`

A full AI chat interface embedded in the homepage search bar.

**Features:**
- **Animated placeholder** — Cycles through 4 example questions with typewriter effect using `requestAnimationFrame` (not `setInterval`) to prevent forced reflows
- **Quick questions** — 4 pre-built question chips for common queries
- **SSE streaming** — Reads the response body stream chunk by chunk, parsing `data: {json}` lines
- **Portal rendering** — The modal is rendered via `createPortal(…, document.body)` at `z-[100]` to avoid stacking context issues
- **Markdown rendering** — AI responses are rendered via `MarkdownRenderer` which converts links, bold, lists to React elements. Internal links (`/guides/...`, `/directory/...`) use React Router `<Link>`.

### 8.2 `SEO` — Dynamic Meta Tags

**File:** `src/components/SEO.tsx`

A headless component that uses `useEffect` to dynamically update:
- `document.title`
- Meta tags: `description`, `og:title`, `og:description`, `og:type`, `og:image`, `twitter:*`
- `<link rel="canonical">`
- `<script type="application/ld+json">` (cleaned up on unmount)

**JSON-LD helpers:**
- `generateOrganizationJsonLd()` — Schema.org Organization
- `generateWebsiteJsonLd()` — Schema.org WebSite with SearchAction
- `generateHowToJsonLd(guide)` — Schema.org HowTo for guide detail pages
- `generateGovServiceJsonLd(service)` — Schema.org GovernmentService

### 8.3 `FaviconImage` — Favicon Proxy

**File:** `src/components/FaviconImage.tsx`

Displays website favicons using Google's favicon proxy (`https://www.google.com/s2/favicons?domain=...&sz=32`).

**Optimizations:**
- **Broken favicon cache** — Uses a module-level `Set<string>` to track domains with broken favicons, avoiding repeated 404s across re-renders
- **Loading state** — Shows a `Globe` icon while loading, then swaps to the image
- **Lazy loading** — Uses `loading="lazy"` and `decoding="async"` on the `<img>` tag

**`getAgencyDomain(officialLinks)`** — Extracts the primary `.gov.bd` or `.org.bd` domain from a guide's official links array for favicon display.

### 8.4 `MarkdownRenderer`

**File:** `src/components/MarkdownRenderer.tsx`

A lightweight Markdown-to-React converter (no external markdown library).

Handles:
- **Paragraphs** — Splits on `\n\n`
- **Bold** — `**text**` → `<strong>`
- **Internal links** — `[label](/path)` → React Router `<Link>`
- **External links** — `[label](https://...)` → `<a target="_blank">`
- **Numbered lists** — `1. item` or `1) item`
- **Bullet lists** — `- item` or `• item`

### 8.5 Other notable components

| Component | Description |
|---|---|
| `ScrapeStatusBadge` | Renders colored badges for scrape status (success/failed/in_progress/pending) |
| `Breadcrumbs` | Breadcrumb navigation using `@/components/ui/breadcrumb` |
| `PageTransition` | Framer Motion `motion.div` wrapper for page enter/exit animations |
| `WarningBanner` | Yellow disclaimer banner shown on guide pages |
| `LanguageToggle` | EN/BN toggle button in the header |

---

## 9. Pages

### 9.1 Index (Homepage)

**File:** `src/pages/Index.tsx` (~590 lines)

| Section | Description |
|---|---|
| **Hero** | Time-based greeting, trust badge, animated heading with `gradient-text`, AI search bar with glow effect |
| **Stats** | 4 animated counters (guides, portals, scraped details, citations) using `useCounter` hook with `requestAnimationFrame` easing |
| **Category chips** | 7 popular service shortcuts (Passport, NID, Driving License, Birth Certificate, Visa, TIN, Land Records) with favicon icons |
| **How it works** | 3-step process cards with numbered badges, icons, and connector lines |
| **Featured sites** | 4 government portal cards with favicon, category badge, and link to directory detail |
| **Featured guides** | Up to 4 guides rendered as cards linking to guide detail pages |

**Performance notes:**
- Featured sites are inlined (`FEATURED_SITES` constant) to avoid importing the full 887-line `govDirectory.ts`
- Scrape status count is deferred via dynamic `import()` so it doesn't block LCP
- Uses `framer-motion` `useInView` for scroll-triggered animations

### 9.2 Guides + GuideDetail

**Guides list** (`src/pages/Guides.tsx`):
- Search input filtering via `listGuides({ search })`
- Card grid showing title, agency, step count, citation count
- Links to `/guides/:guide_id`

**Guide detail** (`src/pages/GuideDetail.tsx`, ~612 lines):
- **Variant selector** — Toggle between Regular, Express, Super Express (when available)
- **Steps section** — Numbered steps with expandable citation accordions
- **Fees table** — Structured table with type, pages, delivery, amount columns
- **Required documents** — Bulleted list with citations
- **Eligibility** — Who can apply section
- **Processing time** — Duration information
- **Official links** — External links to government portals
- **Breadcrumbs** — Home > Guides > Guide Title
- **SEO** — Dynamic `HowTo` JSON-LD for each guide

### 9.3 Directory + SiteDetail

**Directory** (`src/pages/Directory.tsx`):
- Category accordion/grid showing all 21 categories
- Each category expands to show its links with favicons
- Bengali name display when language is `bn`
- Links to `/directory/:slug`

**Site detail** (`src/pages/SiteDetail.tsx`, ~565 lines):
- Fetches scraped data from `gov_site_details` table
- Renders: description, mission, services list, contact info (phone/email/address), office hours, related links
- Shows favicon and brand color
- Scrape status badge
- Category branding via `govBranding.ts`

### 9.4 BulkScrape (Admin)

**File:** `src/pages/BulkScrape.tsx` (~860 lines)

Password-protected admin tool for managing the scraping pipeline. The password must come from secure environment configuration, not hardcoded values.

**Features:**
- **Stats dashboard** — Total sites, scraped, failed, incomplete, unreachable
- **URL validation** — Batch validates all 700+ URLs via the `validate-url` edge function with progress bar
- **Auto-redirect** — Automatically applies redirected URLs (saves to localStorage)
- **Single scrape** — Scrape one site at a time
- **Bulk scrape** — Sequential scraping with 5-second delays between requests, cancel support, progress tracking
- **Tab filters** — All, Not Scraped, Success, Failed, Incomplete, Unreachable, Unknown
- **Search** — Filter by name, URL, or category
- **Persistent state** — Validation results and URL overrides saved to localStorage

### 9.5 About

**File:** `src/pages/About.tsx`

Static page with:
- What is INFOBASE description
- How we work methodology
- Important disclaimer
- FAQ section (3 questions)
- Official resources links
- Contact information

---

## 10. Performance Optimizations

### Code splitting

All pages are lazy-loaded via `React.lazy()` in `App.tsx`:

```typescript
const Index = lazy(() => import("./pages/Index"));
const Guides = lazy(() => import("./pages/Guides"));
// ...
```

This ensures the initial bundle only includes the framework + layout. Each page chunk loads on navigation.

### Deferred Supabase queries

The homepage's "scraped details" counter doesn't block initial render:

```typescript
useEffect(() => {
  import('@/hooks/useScrapeStatusFetch').then(({ fetchScrapeStats }) =>
    fetchScrapeStats().then(s => setScrapeSuccessCount(s.success))
  );
}, []);
```

### CLS prevention

- **Pre-rendered HTML shell** in `index.html` matches the hero layout to prevent layout shift during React hydration
- **Critical inline CSS** in `<head>` sets body background, font, and hero styles
- **Font loading** uses `<link rel="preload" as="style" onload="this.rel='stylesheet'">` pattern with `<noscript>` fallback

### Resource hints

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="preconnect" href="https://ceqdfmzsbrntihilvnxp.supabase.co" />
<link rel="dns-prefetch" href="https://t0.gstatic.com" />
<!-- + t1, t2, t3 for Google favicon shards -->
```

### Animation performance

- `AnimatedPlaceholder` uses `requestAnimationFrame` instead of `setInterval` to prevent forced reflows
- Rotating ring decorations use CSS `contain: layout style` to isolate their paint layer
- Framer Motion `viewport={{ once: true }}` prevents re-triggering of scroll animations

### Favicon caching

`FaviconImage` maintains a module-level `brokenFaviconCache` Set to avoid repeated 404 network requests for domains with broken favicons.

---

## 11. SEO

### Static HTML shell

`index.html` includes pre-rendered content matching the hero section:

```html
<div id="initial-loader">
  <div class="hero-title">Every Government Service</div>
  <div class="hero-sub">One Place</div>
</div>
```

This provides immediate content for crawlers that don't execute JavaScript.

### Meta tags

Set statically in `index.html` and updated dynamically by the `SEO` component:

- `<title>` — Page-specific, under 60 characters
- `<meta name="description">` — Under 160 characters
- Open Graph: `og:title`, `og:description`, `og:type`, `og:image`
- Twitter Card: `twitter:card`, `twitter:site`, `twitter:image`

### JSON-LD Structured Data

| Page | Schema Type | Purpose |
|---|---|---|
| Homepage | `WebSite` + `Organization` | Enables sitelinks search box in Google |
| Guide Detail | `HowTo` | Enables step-by-step rich results |
| Site Detail | `GovernmentService` | Enables government service rich results |

### Semantic HTML

- Single `<h1>` per page
- Proper heading hierarchy (`h1` > `h2` > `h3`)
- `<nav>`, `<main>`, `<footer>` landmarks
- `alt` text on images (favicons use `alt=""` as decorative)

---

## 12. Environment & Secrets

### Frontend environment variables (`.env`)

| Variable | Description | Required |
|---|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL | Auto-configured |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon key | Auto-configured |
| `VITE_SUPABASE_PROJECT_ID` | Supabase project ID | Auto-configured |
| `VITE_USE_REMOTE_GUIDES` | Enable remote guide fetching (`true`/`false`) | Optional, default `false` |
| `VITE_GUIDE_DATA_URL` | URL for remote guide JSON | Optional |
| `VITE_INDEX_DATA_URL` | URL for remote index JSON | Optional |

> **Note:** Use `.env.example` as the baseline template for local setup. Keep `.env` local-only and never commit secrets.

### Backend secrets (Edge Functions)

| Secret | Used by | Description |
|---|---|---|
| `LOVABLE_API_KEY` | `ask`, `scrape-gov-site`, `research-guide` | Auto-provided by Lovable for AI gateway access |
| `FIRECRAWL_API_KEY` | `scrape-gov-site` | Firecrawl API key for web scraping |
| `SUPABASE_URL` | All functions | Auto-provided by Supabase |
| `SUPABASE_ANON_KEY` | `scrape-gov-site`, `research-guide` | Auto-provided by Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | `scrape-gov-site` | Auto-provided, bypasses RLS |

---

## 13. Adding New Guides

### Step 1: Create guide data

Add a new guide object to `src/data/public_guides.json` following the `Guide` schema:

```json
{
  "guide_id": "guide.your-service",
  "service_id": "svc.your-service",
  "agency_id": "agency.your-agency",
  "agency_name": "Agency Name",
  "title": "Your Service Title",
  "overview": "Brief description of the service.",
  "steps": [
    {
      "step_number": 1,
      "title": "Step Title",
      "description": "Step description.",
      "citations": [
        {
          "source_page_id": "src.unique-id",
          "canonical_url": "https://official-source.gov.bd/page",
          "domain": "official-source.gov.bd",
          "page_title": "Page Title",
          "locator": "Section > Subsection",
          "quoted_text": "Exact quote from source",
          "retrieved_at": "2025-01-01T00:00:00Z",
          "language": "en"
        }
      ]
    }
  ],
  "sections": { ... },
  "variants": [ ... ],
  "required_documents": [ ... ],
  "fees": [ ... ],
  "official_links": [ ... ],
  "meta": {
    "total_steps": 5,
    "total_citations": 15,
    "generated_at": "2025-01-01T00:00:00Z",
    "status": "published"
  }
}
```

### Step 2: Add to index

Add a corresponding lightweight entry to `src/data/public_guides_index.json`:

```json
{
  "guide_id": "guide.your-service",
  "service_id": "svc.your-service",
  "agency_id": "agency.your-agency",
  "title": "Your Service Title",
  "agency_name": "Agency Name",
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "step_count": 5,
  "citation_count": 15,
  "status": "published"
}
```

### Step 3: Add Bengali translation

Repeat steps 1 and 2 for the Bengali versions:
- `src/data/public_guides_bn.json`
- `src/data/public_guides_index_bn.json`

### Step 4: Verify

Run the ID checker script:

```bash
node scripts/check-internal-ids.js
```

---

## 14. Adding New Directory Entries

### Step 1: Add to govDirectory.ts

Find the appropriate category in `src/data/govDirectory.ts` and add a new link:

```typescript
{
  name: 'Organization Name',
  nameBn: 'সংস্থার নাম',  // Bengali name
  url: 'https://organization.gov.bd/',
},
```

### Step 2: Scrape the site (optional)

1. Go to `/bulk-scrape` and authenticate with the configured admin password from environment settings
2. Find the new site in the list
3. Click "Scrape" to fetch details via the `scrape-gov-site` edge function
4. The scraped data (description, contact info, services) will appear on the site's detail page

### Step 3: Verify

- Visit `/directory` to confirm the new entry appears
- Visit `/directory/<slug>` to see the detail page
- The slug is auto-generated: `new URL(url).hostname.replace(/^www\./, '').replace(/\./g, '-')`

---

## 15. Deployment

### Publishing

INFOBASE is published via Lovable's built-in publish flow:

1. Click **Publish** in the Lovable editor
2. The app is built with Vite and deployed to `https://infobase.lovable.app`
3. Edge functions are automatically deployed alongside the frontend

### Edge function deployment

Edge functions in `supabase/functions/` are auto-deployed when the project is published. No manual deployment step is needed.

### Configuration files

| File | Purpose | Editable? |
|---|---|---|
| `supabase/config.toml` | Edge function settings (JWT verification) | Auto-managed |
| `.env` | Frontend env vars for local/dev environments | Yes (local only, never commit) |
| `.env.example` | Safe template for required env keys | Yes |
| `src/integrations/supabase/client.ts` | Supabase client | Auto-generated, DO NOT EDIT |
| `src/integrations/supabase/types.ts` | Database types | Auto-generated, DO NOT EDIT |

### Custom domain

The app is published at `https://infobase.lovable.app`. Custom domain configuration is available through the Lovable publish settings.

---

## 16. Operations Runbook

### 16.1 Pre-release checklist

Run all validation commands before publishing:

```bash
npm install
npm run lint
npm run test
npm run build
```

Required pre-release confirmations:

- `.env` includes required `VITE_SUPABASE_*` values
- `dist/sitemap.xml` is regenerated successfully by the build
- `public/robots.txt` still points to the correct sitemap URL
- No hardcoded secrets were introduced in docs, source, or config

### 16.2 Smoke test checklist

After deploy, verify the following flows:

1. Home page loads and navigation is functional
2. `/guides` list renders and at least one guide detail opens
3. `/directory` list renders and one detail page opens
4. AI search responds without runtime errors
5. `/bulk-scrape` access is restricted behind admin authentication

### 16.3 Rollback strategy

If a production release fails:

1. Re-publish the last known good release version from deployment tooling
2. Confirm user-facing routes and guide data are restored
3. Re-run smoke tests before re-opening traffic
4. Record root cause and remediation in the next release notes

### 16.4 Incident response guardrails

- Treat secret exposure as a security incident and rotate affected keys immediately
- Disable vulnerable edge-function entry points if abuse is detected
- Prefer temporary feature isolation over destructive data operations
- Require human approval before any destructive remediation

---

## Appendix: Design System

### Fonts

- **Display/Headings:** Space Grotesk (500, 600, 700)
- **Body:** DM Sans (400, 500, 600, 700)

### Color tokens (CSS custom properties)

All colors are defined as HSL values in `src/index.css` and referenced via Tailwind's semantic classes (`bg-primary`, `text-muted-foreground`, etc.).

### Key custom CSS classes

| Class | Description |
|---|---|
| `.gradient-text` | Primary gradient text (green tones) |
| `.glass-card` | Glassmorphism card with backdrop blur |
| `.search-glow` | Pulsing glow around the AI search bar |
| `.pill-button` | Rounded chip-style button |
| `.stat-card` | Stats counter card |
| `.trust-badge` | Shield badge with trust indicator |
| `.hero-orb` | Floating gradient orb for hero background |
| `.mesh-bg` | Mesh gradient background |
| `.dot-grid` | Dot pattern overlay |

### Dark mode

Full dark mode support via `next-themes`. All color tokens have dark mode variants defined in `index.css` under `.dark { }`.
