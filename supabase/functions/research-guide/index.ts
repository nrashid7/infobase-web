import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

function isAllowedOrigin(origin: string): boolean {
  if (!origin) return false;
  if (origin === 'http://localhost:5173' || origin === 'http://localhost:8080') return true;
  if (origin.endsWith('.lovable.app') || origin.endsWith('.lovableproject.com')) return true;
  return false;
}

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('origin') || '';
  return {
    'Access-Control-Allow-Origin': isAllowedOrigin(origin) ? origin : 'https://infobase.lovable.app',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  };
}

async function verifyAuth(req: Request): Promise<{ authorized: boolean; error?: string }> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return { authorized: false, error: 'Missing authorization header' };
  }
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return { authorized: false, error: 'Invalid or expired token' };
  }
  return { authorized: true };
}

interface ResearchRequest {
  guideId: string;
  serviceName: string;
  agencyName: string;
  officialUrl?: string;
}

interface Citation {
  source_page_id: string;
  canonical_url: string;
  domain: string;
  page_title: string;
  locator: string;
  quoted_text: string;
  retrieved_at: string;
  language: string;
}

interface Step {
  step_number: number;
  title: string;
  description: string;
  citations: Citation[];
}

interface SectionItem {
  label: string;
  description: string | null;
  citations: Citation[];
}

interface FeeItem {
  label: string;
  description: string | null;
  citations: Citation[];
}

interface VariantFee {
  text: string;
  structured_data: {
    amount_bdt: number;
    delivery_type: string;
    pages: number | null;
    delivery_days: number | null;
    validity_years: number | null;
  };
  citations: Citation[];
}

interface Variant {
  variant_id: string;
  label: string;
  fees: VariantFee[];
  processing_times: Array<{ text: string; citations: Citation[] }>;
}

interface OfficialLink {
  label: string;
  url: string;
  source_page_id: string;
}

interface GuideData {
  guide_id: string;
  service_id: string;
  agency_id: string;
  agency_name: string;
  title: string;
  overview: string;
  steps: Step[];
  sections: {
    eligibility: SectionItem[];
    required_documents: SectionItem[];
    fees: FeeItem[];
    processing_time: SectionItem[];
    service_info: SectionItem[];
  };
  variants: Variant[];
  required_documents: SectionItem[];
  fees: FeeItem[];
  official_links: OfficialLink[];
  meta: {
    total_steps: number;
    total_citations: number;
    last_crawled_at: string;
    source_domains: string[];
    generated_at: string;
    last_updated_at: string;
    status: string;
  };
}

interface CrawledPage {
  url: string;
  title: string;
  markdown: string;
}

async function crawlOfficialPortal(officialUrl: string, firecrawlApiKey: string): Promise<CrawledPage[]> {
  const pages: CrawledPage[] = [];
  try {
    console.log('[Crawl] Crawling official portal:', officialUrl);

    const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${firecrawlApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: officialUrl,
        formats: ['markdown'],
        onlyMainContent: true,
        waitFor: 5000,
        timeout: 30000,
        location: { country: 'BD', languages: ['bn', 'en'] },
        skipTlsVerification: true,
      }),
    });

    const scrapeResult = await scrapeResponse.json();
    if (scrapeResponse.ok && scrapeResult.success) {
      const data = scrapeResult.data || scrapeResult;
      if (data.markdown && data.markdown.length > 200) {
        pages.push({
          url: officialUrl,
          title: data.metadata?.title || 'Official Portal',
          markdown: data.markdown,
        });
        console.log(`[Crawl] Main page: ${data.markdown.length} chars`);
      }
    }

    // Also try to find and scrape key sub-pages
    const mapResponse = await fetch('https://api.firecrawl.dev/v1/map', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${firecrawlApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: officialUrl, search: 'apply fee document process', limit: 10 }),
    });

    const mapResult = await mapResponse.json();
    if (mapResponse.ok && mapResult.success && Array.isArray(mapResult.links)) {
      const keywords = ['apply', 'application', 'fee', 'charge', 'eligibility', 'faq', 'document', 'process', 'service', 'how-to', 'requirement'];
      const subPages = mapResult.links
        .filter((link: string) => link !== officialUrl && keywords.some(kw => link.toLowerCase().includes(kw)))
        .slice(0, 5);

      for (const subUrl of subPages) {
        try {
          const subResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${firecrawlApiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              url: subUrl,
              formats: ['markdown'],
              onlyMainContent: true,
              timeout: 20000,
              location: { country: 'BD' },
              skipTlsVerification: true,
            }),
          });
          const subResult = await subResponse.json();
          if (subResponse.ok && subResult.success) {
            const subData = subResult.data || subResult;
            if (subData.markdown && subData.markdown.length > 100) {
              pages.push({
                url: subUrl,
                title: subData.metadata?.title || subUrl,
                markdown: subData.markdown,
              });
              console.log(`[Crawl] Sub-page ${subUrl}: ${subData.markdown.length} chars`);
            }
          }
        } catch { /* skip failed sub-pages */ }
      }
    }
  } catch (err) {
    console.warn('[Crawl] Error:', err);
  }
  return pages;
}

async function synthesizeGuideWithGemini(
  serviceName: string,
  agencyName: string,
  officialUrl: string | undefined,
  crawledContent: string,
  lovableApiKey: string,
): Promise<string | null> {
  const portalContext = crawledContent.length > 200
    ? `\n\nBelow is actual content scraped from the official portal. Use this as your PRIMARY source of information:\n\n${crawledContent.slice(0, 30000)}\n\n---\n`
    : '';

  const researchQuery = `Bangladesh ${serviceName} complete guide 2025-2026:
- Official application process step by step (be detailed, include online and offline options)
- Required documents list (be specific about each document)
- Fees and payment options (Regular, Express, Super Express if available) in BDT
- Processing time for each option in working days
- Eligibility requirements
- Official portal URL and online services
- Important tips and common mistakes to avoid

Focus on information from ${officialUrl || 'official government sources'} and ${agencyName}.
Provide specific amounts in BDT and exact processing times in working days.${portalContext}`;

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${lovableApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      stream: false,
      messages: [
        {
          role: 'system',
          content: 'You are an expert researcher specializing in Bangladesh government services. ' +
            'Provide comprehensive, accurate, and up-to-date information about government procedures. ' +
            'Always cite specific sources and provide exact figures (fees in BDT, processing times in days). ' +
            'When official portal content is provided, prioritize that over other sources.',
        },
        { role: 'user', content: researchQuery },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Gemini research error:', response.status, errorText);
    return null;
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || null;
}

async function extractGuideStructureWithGemini(
  serviceName: string,
  researchContent: string,
  lovableApiKey: string,
): Promise<Record<string, unknown> | null> {
  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${lovableApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      stream: false,
      messages: [
        {
          role: 'system',
          content: 'Extract structured JSON from research content. Return ONLY valid JSON, no surrounding text or markdown.',
        },
        {
          role: 'user',
          content: `Extract structured data from this research about ${serviceName}:

${researchContent}

JSON schema:
{
  "overview": "One paragraph summary of the service",
  "steps": [{ "step_number": 1, "title": "...", "description": "Detailed description" }],
  "eligibility": [{ "label": "...", "description": "..." }],
  "required_documents": [{ "label": "Document name", "description": "Details" }],
  "fees": {
    "regular": { "amount_bdt": 0, "delivery_days": 0 },
    "express": { "amount_bdt": 0, "delivery_days": 0 },
    "super_express": { "amount_bdt": 0, "delivery_days": 0 }
  },
  "processing_time": [{ "label": "...", "description": "X working days" }],
  "tips": [{ "label": "...", "description": "..." }],
  "official_links": [{ "label": "...", "url": "https://..." }]
}

Use null for unavailable fields. Only include real data.`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Gemini extraction error:', response.status, errorText);
    return null;
  }

  const extractionData = await response.json();
  let content = extractionData.choices?.[0]?.message?.content || '';
  try {
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(content);
  } catch {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const auth = await verifyAuth(req);
    if (!auth.authorized) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const { guideId, serviceName, agencyName, officialUrl } = await req.json() as ResearchRequest;

    if (!guideId || !serviceName) {
      return new Response(
        JSON.stringify({ success: false, error: 'guideId and serviceName are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Lovable AI connector not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    console.log(`=== Researching guide: ${serviceName} (${agencyName}) ===`);

    // ── Step 1: Crawl the official portal ─────────────────────────────
    let crawledPages: CrawledPage[] = [];
    if (officialUrl && firecrawlApiKey) {
      crawledPages = await crawlOfficialPortal(officialUrl, firecrawlApiKey);
      console.log(`Crawled ${crawledPages.length} pages from ${officialUrl}`);
    } else if (!firecrawlApiKey) {
      console.warn('FIRECRAWL_API_KEY not set — skipping portal crawl');
    }

    const crawledContent = crawledPages
      .map(p => `=== Page: ${p.title} (${p.url}) ===\n${p.markdown}`)
      .join('\n\n');

    // ── Step 2: Research with Gemini (enhanced with crawled content) ──
    const researchContent = await synthesizeGuideWithGemini(
      serviceName,
      agencyName,
      officialUrl,
      crawledContent,
      lovableApiKey,
    );

    if (!researchContent) {
      return new Response(
        JSON.stringify({ success: false, error: 'Gemini research synthesis failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    console.log('Research done, extracting structure...');

    // ── Step 3: Extract structured data ───────────────────────────────
    const structuredData = await extractGuideStructureWithGemini(serviceName, researchContent, lovableApiKey);

    // ── Step 4: Build citations from REAL scraped pages ──
    const now = new Date().toISOString();
    const allCitationUrls: string[] = [
      ...crawledPages.map(p => p.url),
    ];
    const sourceDomains = allCitationUrls
      .map(c => { try { return new URL(c).hostname; } catch { return c; } })
      .filter((d, i, arr) => arr.indexOf(d) === i);

    const buildCitation = (pageUrl: string, pageTitle: string, locator: string, text?: string): Citation => ({
      source_page_id: `source.${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      canonical_url: pageUrl,
      domain: (() => { try { return new URL(pageUrl).hostname; } catch { return pageUrl; } })(),
      page_title: pageTitle,
      locator,
      quoted_text: text || '',
      retrieved_at: now,
      language: 'en',
    });

    // Build citations directly from crawled pages
    const primaryCitations: Citation[] = [];
    for (const page of crawledPages) {
      primaryCitations.push(buildCitation(page.url, page.title, 'Official Portal Content'));
    }
    if (primaryCitations.length === 0 && officialUrl) {
      primaryCitations.push(buildCitation(officialUrl, serviceName, 'Official Portal'));
    }

    // ── Step 5: Build guide data ──────────────────────────────────────
    const steps: Step[] = (structuredData?.steps as Record<string, unknown>[] || []).map((s, idx) => ({
      step_number: (s.step_number as number) || idx + 1,
      title: (s.title as string) || `Step ${idx + 1}`,
      description: (s.description as string) || '',
      citations: primaryCitations,
    }));

    const buildSectionItems = (items: Record<string, unknown>[]): SectionItem[] =>
      (items || []).map(item => ({
        label: (item.label as string) || String(item),
        description: (item.description as string) || null,
        citations: primaryCitations,
      }));

    const variants: Variant[] = [];
    const feesData = (structuredData?.fees || {}) as Record<string, Record<string, unknown>>;

    for (const [variantId, variantLabel] of [['regular', 'Regular'], ['express', 'Express'], ['super_express', 'Super Express']] as const) {
      const vData = feesData[variantId];
      if (vData?.amount_bdt) {
        variants.push({
          variant_id: variantId,
          label: variantLabel,
          fees: [{
            text: `${variantLabel} delivery: ৳${vData.amount_bdt}`,
            structured_data: {
              amount_bdt: vData.amount_bdt as number,
              delivery_type: variantId,
              pages: null,
              delivery_days: (vData.delivery_days as number) || null,
              validity_years: null,
            },
            citations: primaryCitations,
          }],
          processing_times: vData.delivery_days ? [{
            text: `${vData.delivery_days} working days`,
            citations: primaryCitations,
          }] : [],
        });
      }
    }

    const fees: FeeItem[] = variants.map(v => ({
      label: v.fees[0]?.text || v.label,
      description: v.processing_times[0]?.text || null,
      citations: primaryCitations,
    }));

    const officialLinks: OfficialLink[] = [
      ...(officialUrl ? [{ label: 'Official Portal', url: officialUrl, source_page_id: primaryCitations[0]?.source_page_id || '' }] : []),
      ...((structuredData?.official_links as Record<string, unknown>[] || []).map(l => ({
        label: (l.label as string) || 'Official Link',
        url: l.url as string,
        source_page_id: primaryCitations[0]?.source_page_id || '',
      }))),
      // Add discovered pages from crawl as official links
      ...crawledPages
        .filter(p => p.url !== officialUrl)
        .map(p => ({
          label: p.title,
          url: p.url,
          source_page_id: primaryCitations.find(c => c.canonical_url === p.url)?.source_page_id || '',
        })),
    ].filter((l, i, arr) => l.url && arr.findIndex(x => x.url === l.url) === i);

    const guideData: GuideData = {
      guide_id: guideId,
      service_id: guideId.replace('guide.', 'svc.'),
      agency_id: `agency.${agencyName.toLowerCase().replace(/[^a-z]/g, '').substring(0, 10)}`,
      agency_name: agencyName,
      title: serviceName,
      overview: (structuredData?.overview as string) || null!,
      steps,
      sections: {
        eligibility: buildSectionItems(structuredData?.eligibility as Record<string, unknown>[]),
        required_documents: buildSectionItems(structuredData?.required_documents as Record<string, unknown>[]),
        fees,
        processing_time: buildSectionItems(structuredData?.processing_time as Record<string, unknown>[]),
        service_info: buildSectionItems(structuredData?.tips as Record<string, unknown>[]),
      },
      variants,
      required_documents: buildSectionItems(structuredData?.required_documents as Record<string, unknown>[]),
      fees,
      official_links: officialLinks,
      meta: {
        total_steps: steps.length,
        total_citations: primaryCitations.length,
        last_crawled_at: now,
        source_domains: sourceDomains,
        generated_at: now,
        last_updated_at: now,
        status: 'researched',
      },
    };

    console.log(`=== Guide research done: ${steps.length} steps, ${primaryCitations.length} citations ===`);

    return new Response(
      JSON.stringify({
        success: true,
        guide: guideData,
        rawContent: researchContent,
        citations: allCitationUrls,
        crawledPages: crawledPages.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('Research error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Failed to research guide' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
