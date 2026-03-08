

## Plan: Create Comprehensive Project Documentation

Create a detailed `DOCUMENTATION.md` file at the project root that covers the entire application architecture, data flow, backend functions, and development processes. This will serve as a complete handover document.

### File to Create

**`DOCUMENTATION.md`** (single comprehensive file) covering:

1. **Project Overview** - What INFOBASE is, its purpose, tech stack, published URL
2. **Architecture Overview** - ASCII diagram of frontend/backend data flow
3. **Directory Structure** - Key folders and their purposes
4. **Data Layer**
   - `guidesStore.ts` - how guide data is loaded, language switching, lookup maps, API surface
   - `govDirectory.ts` - static directory of 700+ government links with Bengali translations
   - JSON data files (`public_guides.json`, `public_guides_bn.json`, index files)
   - Schema of `Guide`, `GuideIndexEntry`, `Citation`, `Step`, etc.
5. **Bilingual System**
   - `LanguageContext.tsx` - how language toggle works, localStorage persistence
   - UI translations dictionary (en/bn)
   - Guide data switching via `setGuidesLanguage()`
   - Directory `nameBn` fallback pattern
6. **Backend Functions** (Edge Functions)
   - `ask` - AI-powered Q&A using Lovable AI gateway (Gemini 2.5 Flash), streaming SSE, context injection from guides + directory
   - `scrape-gov-site` - Multi-layered scraping (Firecrawl primary, Perplexity sonar-pro fallback), data extraction, database upsert
   - `research-guide` - Perplexity-based guide research, structured JSON extraction, citation building
   - `validate-url` - URL validation endpoint
   - Auth patterns, CORS, error handling
7. **Database** - `gov_site_details` table schema, RLS policies, scrape status lifecycle
8. **Key Components**
   - `GlobalSearch` - AI chat modal with streaming, animated placeholder, quick questions
   - `SEO` - Dynamic meta tags, JSON-LD structured data
   - `FaviconImage` - Google favicon proxy with broken-cache optimization
   - `ScrapeStatusBadge`, `MarkdownRenderer`, `Breadcrumbs`
9. **Pages**
   - Index (homepage) - hero, stats counters, category chips, featured sites
   - Guides list + GuideDetail - variant selector, fees table, citation accordion
   - Directory + SiteDetail - category grid, scrape status, contact rendering
   - BulkScrape - admin tool for batch scraping with validation
   - About - FAQ, disclaimer
10. **Performance Optimizations** - Lazy loading, code splitting, deferred Supabase queries, CLS fixes, preconnect hints
11. **SEO** - Pre-rendered HTML shell in `index.html`, meta tags, JSON-LD, sitemap considerations
12. **Environment & Secrets** - Required secrets (FIRECRAWL_API_KEY, PERPLEXITY_API_KEY, LOVABLE_API_KEY), env vars
13. **Adding New Guides** - How to add/update guide JSON data
14. **Adding New Directory Entries** - How to add government links with Bengali names
15. **Deployment** - Lovable publish flow, edge function auto-deploy

