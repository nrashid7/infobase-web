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

interface ScrapeRequest {
  url: string;
  name: string;
  categoryId: string;
}

const invalidPatterns = [
  'not provided', 'not available', 'n/a', 'na', 'none', 'null', 'undefined',
  'contact us', 'coming soon', 'to be updated', 'under construction',
  'information not found', 'not found', 'no information',
];

function isValidContactValue(value: string | null | undefined): boolean {
  if (!value) return false;
  const normalized = value.toLowerCase().trim();
  if (normalized.length < 3) return false;
  if (normalized === '-' || normalized === '--' || normalized === '...') return false;
  return !invalidPatterns.some(pattern => normalized.includes(pattern));
}

function cleanContactInfo(contactInfo: Record<string, unknown> | null): Record<string, unknown> | null {
  if (!contactInfo) return null;
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(contactInfo)) {
    if (typeof value === 'string') {
      if (isValidContactValue(value)) cleaned[key] = value.trim();
    } else if (typeof value === 'object' && value !== null) {
      const nestedCleaned: Record<string, string> = {};
      for (const [nk, nv] of Object.entries(value as Record<string, string>)) {
        if (typeof nv === 'string' && isValidContactValue(nv)) nestedCleaned[nk] = nv.trim();
      }
      if (Object.keys(nestedCleaned).length > 0) cleaned[key] = nestedCleaned;
    }
  }
  return Object.keys(cleaned).length > 0 ? cleaned : null;
}

function computeContentQuality(info: Record<string, unknown>): number {
  let score = 0;
  const weights = { description: 0.25, services: 0.25, contact_info: 0.2, mission: 0.1, office_hours: 0.1, related_links: 0.1 };
  if (info.description) score += weights.description;
  if (Array.isArray(info.services) && info.services.length > 0) score += weights.services;
  if (info.contact_info && Object.keys(info.contact_info as object).length > 0) score += weights.contact_info;
  if (info.mission) score += weights.mission;
  if (info.office_hours) score += weights.office_hours;
  if (Array.isArray(info.related_links) && info.related_links.length > 0) score += weights.related_links;
  return Math.round(score * 100) / 100;
}

const categoryColors: Record<string, string> = {
  'core-government': '#006a4e', 'key-ministries': '#1e3a5f', 'public-services': '#0284c7',
  'e-governance': '#059669', 'law-judiciary': '#1e3a5f', 'economic-institutions': '#0f766e',
  'education-research': '#7c3aed', 'health-services': '#0891b2', 'agriculture-environment': '#16a34a',
  'energy-utilities': '#ea580c', 'transport-infrastructure': '#475569', 'communication-it': '#6366f1',
  'local-government': '#0d9488', 'additional-ministries': '#4f46e5', 'social-services': '#db2777',
  'planning-development': '#0284c7', 'security-defense': '#3f6212', 'regulatory-commissions': '#7c2d12',
  'disaster-emergency': '#dc2626', 'maritime-ports': '#0369a1', 'administrative-directory': '#6366f1',
};

const EXTRACTION_SCHEMA = {
  type: 'object',
  properties: {
    description: { type: 'string', description: '2-3 sentence description of what this organization does and its role in Bangladesh government' },
    mission: { type: 'string', description: 'Mission or vision statement if available, otherwise null' },
    services: {
      type: 'array',
      items: { type: 'object', properties: { name: { type: 'string' }, description: { type: 'string' } }, required: ['name'] },
      description: 'Up to 8 specific services provided to citizens',
    },
    contact_info: {
      type: 'object',
      properties: {
        phone: { type: 'string', description: 'Phone number(s) with +880 country code' },
        email: { type: 'string', description: 'Email address(es)' },
        address: { type: 'string', description: 'Full physical address' },
        fax: { type: 'string', description: 'Fax number if available' },
      },
    },
    office_hours: { type: 'string', description: 'Working hours, e.g. Sun-Thu 9AM-5PM' },
    related_links: {
      type: 'array',
      items: { type: 'object', properties: { title: { type: 'string' }, url: { type: 'string' } }, required: ['title', 'url'] },
      description: 'Up to 6 important related links or subpages',
    },
    establishment_year: { type: 'string', description: 'Year the organization was established' },
    social_media: {
      type: 'object',
      properties: { facebook: { type: 'string' }, twitter: { type: 'string' }, youtube: { type: 'string' } },
      description: 'Social media profile URLs',
    },
  },
};

async function discoverPages(url: string, firecrawlApiKey: string): Promise<string[]> {
  const urls = [url];
  try {
    console.log('[Map] Discovering pages on', url);
    const response = await fetch('https://api.firecrawl.dev/v1/map', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${firecrawlApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, search: 'contact about services mission', limit: 15 }),
    });
    const result = await response.json();

    if (response.ok && result.success && Array.isArray(result.links) && result.links.length > 0) {
      const relevant = ['contact', 'about', 'service', 'mission', 'vision', 'office', 'info'];
      const scored = result.links
        .filter((link: string) => link !== url)
        .map((link: string) => {
          const lower = link.toLowerCase();
          const matchCount = relevant.filter(kw => lower.includes(kw)).length;
          return { link, score: matchCount };
        })
        .sort((a: { score: number }, b: { score: number }) => b.score - a.score);

      const topLinks = scored.slice(0, 4).map((s: { link: string }) => s.link);
      urls.push(...topLinks);
      console.log(`[Map] Found ${result.links.length} URLs, selected ${topLinks.length} relevant pages`);
    } else {
      console.warn('[Map] No links returned or request failed');
    }
  } catch (err) {
    console.warn('[Map] Error:', err);
  }
  return urls;
}

async function extractWithFirecrawl(
  urls: string[], name: string, url: string, firecrawlApiKey: string
): Promise<{ data: Record<string, unknown> | null; branding: Record<string, unknown> | null }> {
  try {
    console.log(`[Extract] Extracting structured data from ${urls.length} URL(s)`);
    const response = await fetch('https://api.firecrawl.dev/v1/extract', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${firecrawlApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        urls,
        prompt: `Extract comprehensive information about "${name}", a Bangladesh government organization at ${url}. ` +
          `Find their description, mission, services they provide to citizens, contact details (phone with +880 code, email, full address, fax), ` +
          `office hours, important links, establishment year, and social media profiles. ` +
          `Only include real, verified information. Use null for anything not found.`,
        schema: EXTRACTION_SCHEMA,
        enableWebSearch: true,
      }),
    });

    const result = await response.json();
    if (response.ok && result.success && result.data) {
      console.log('[Extract] Extraction successful');
      return { data: result.data, branding: null };
    }
    console.warn('[Extract] Failed:', result.error || 'No data returned');
  } catch (err) {
    console.warn('[Extract] Error:', err);
  }
  return { data: null, branding: null };
}

async function scrapeWithFirecrawl(
  url: string, firecrawlApiKey: string
): Promise<{ markdown: string | null; branding: Record<string, unknown> | null }> {
  const configs = [
    { formats: ['markdown', 'branding'], waitFor: 5000 },
    { formats: ['markdown'], waitFor: 8000 },
    { formats: ['rawHtml'], waitFor: 10000 },
  ];

  for (const config of configs) {
    try {
      console.log(`[Scrape] Trying formats: ${config.formats.join(', ')}`);
      const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${firecrawlApiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          formats: config.formats,
          onlyMainContent: !config.formats.includes('rawHtml'),
          waitFor: config.waitFor,
          timeout: 45000,
          location: { country: 'BD', languages: ['bn', 'en'] },
          skipTlsVerification: true,
        }),
      });

      const result = await response.json();
      if (response.ok && result.success) {
        const data = result.data || result;
        let markdown = data.markdown || '';
        if (!markdown && data.rawHtml) {
          markdown = (data.rawHtml as string)
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
        }
        if (markdown.length >= 300) {
          console.log(`[Scrape] Got ${markdown.length} chars`);
          return { markdown, branding: data.branding || null };
        }
      }
    } catch (err) {
      console.warn(`[Scrape] Error with ${config.formats.join(', ')}:`, err);
    }
  }
  return { markdown: null, branding: null };
}

function htmlToText(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function fetchTextWithTimeout(targetUrl: string, timeoutMs: number): Promise<string | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(targetUrl, {
      method: 'GET',
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      return null;
    }

    const html = await response.text();
    const text = htmlToText(html);
    return text.length >= 200 ? text : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

type DirectFetchMethod = 'direct_fetch' | 'http_fallback' | 'google_cache' | 'wayback_archive' | null;

async function directFetchWithFallback(url: string): Promise<{ text: string | null; method: DirectFetchMethod }> {
  try {
    console.log('[DirectFetch] Attempting direct HTTPS fetch');
    const directText = await fetchTextWithTimeout(url, 15000);
    if (directText) {
      return { text: directText, method: 'direct_fetch' };
    }
  } catch {
    // Continue to fallback attempts.
  }

  if (url.startsWith('https://')) {
    try {
      const httpUrl = url.replace('https://', 'http://');
      console.log('[DirectFetch] HTTPS failed, trying HTTP fallback');
      const httpText = await fetchTextWithTimeout(httpUrl, 12000);
      if (httpText) {
        return { text: httpText, method: 'http_fallback' };
      }
    } catch {
      // Continue to cache/archive attempts.
    }
  }

  try {
    const cacheUrl = `https://webcache.googleusercontent.com/search?q=cache:${encodeURIComponent(url)}`;
    console.log('[DirectFetch] Trying Google cache');
    const cacheText = await fetchTextWithTimeout(cacheUrl, 12000);
    if (cacheText) {
      return { text: cacheText, method: 'google_cache' };
    }
  } catch {
    // Continue to archive attempt.
  }

  try {
    const waybackApiUrl = `https://archive.org/wayback/available?url=${encodeURIComponent(url)}`;
    console.log('[DirectFetch] Trying Wayback snapshot');
    const waybackResponse = await fetch(waybackApiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    if (waybackResponse.ok) {
      const waybackData = await waybackResponse.json();
      const snapshotUrl = waybackData?.archived_snapshots?.closest?.url as string | undefined;
      if (snapshotUrl) {
        const waybackText = await fetchTextWithTimeout(snapshotUrl, 15000);
        if (waybackText) {
          return { text: waybackText, method: 'wayback_archive' };
        }
      }
    }
  } catch {
    // No more fallbacks.
  }

  return { text: null, method: null };
}

async function extractStructuredWithGemini(
  text: string, name: string, url: string, lovableApiKey: string
): Promise<Record<string, unknown>> {
  try {
    const truncated = text.slice(0, 30000);
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${lovableApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        stream: false,
        messages: [
          {
            role: 'system',
            content: 'You extract structured JSON from text about government organizations. Return ONLY valid JSON. Use null for missing information — never use placeholders like "Not provided" or "N/A".',
          },
          {
            role: 'user',
            content: `Extract structured data about "${name}" (${url}) from this content.

Return JSON:
{
  "description": "2-3 sentence description or null",
  "mission": "mission statement or null",
  "services": [{"name": "...", "description": "..."}] or [],
  "contact_info": {"phone": "...", "email": "...", "address": "...", "fax": "..."} (null for missing),
  "office_hours": "..." or null,
  "related_links": [{"title": "...", "url": "..."}] or [],
  "establishment_year": "..." or null,
  "social_media": {"facebook": "...", "twitter": "...", "youtube": "..."} or null
}

Content:
${truncated}

Return ONLY the JSON object.`,
          },
        ],
      }),
    });

    const result = await response.json();
    if (response.ok) {
      const content = result.choices?.[0]?.message?.content || '';
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
    }
  } catch (err) {
    console.warn('[Extract-Text] Error:', err);
  }
  return {};
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, name, categoryId } = await req.json() as ScrapeRequest;

    if (!url || !name || !categoryId) {
      return new Response(
        JSON.stringify({ success: false, error: 'URL, name, and categoryId are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!firecrawlApiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl connector not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

    await supabase.from('gov_site_details').upsert(
      { url, name, category_id: categoryId, scrape_status: 'in_progress' },
      { onConflict: 'url' },
    );

    console.log(`=== Scraping: ${name} (${url}) ===`);

    let extractedInfo: Record<string, unknown> = {};
    let scrapeMethod = '';
    let brandingData: Record<string, unknown> | null = null;

    // ── Strategy 1: Map + Extract (best quality) ──────────────────────
    const discoveredUrls = await discoverPages(url, firecrawlApiKey);
    const extractResult = await extractWithFirecrawl(discoveredUrls, name, url, firecrawlApiKey);

    if (extractResult.data) {
      extractedInfo = extractResult.data;
      scrapeMethod = 'firecrawl_extract';
      brandingData = extractResult.branding;
    }

    // ── Strategy 2: Scrape + direct fetch + Gemini extraction (fallback) ────────
    const hasExtractContent = !!extractedInfo.description ||
      (Array.isArray(extractedInfo.services) && extractedInfo.services.length > 0);

    if (!hasExtractContent) {
      console.log('[Fallback] Extract insufficient, trying scrape + direct fetch + Gemini...');

      const scrapeResult = await scrapeWithFirecrawl(url, firecrawlApiKey);
      brandingData = scrapeResult.branding || brandingData;

      const directFetchResult = await directFetchWithFallback(url);
      const directFetchText = directFetchResult.text;
      const combinedText = [scrapeResult.markdown, directFetchText].filter(Boolean).join('\n\n--- Website Content ---\n\n');

      if (combinedText.length > 100 && lovableApiKey) {
        extractedInfo = await extractStructuredWithGemini(combinedText, name, url, lovableApiKey);
        const hasScrapeContent = !!scrapeResult.markdown;
        if (hasScrapeContent && directFetchText && directFetchResult.method) {
          scrapeMethod = `firecrawl+${directFetchResult.method}+gemini`;
        } else if (hasScrapeContent) {
          scrapeMethod = 'firecrawl+gemini';
        } else if (directFetchText && directFetchResult.method) {
          scrapeMethod = `${directFetchResult.method}+gemini`;
        } else {
          scrapeMethod = 'gemini_only';
        }
      } else if (!lovableApiKey) {
        scrapeMethod = 'failed';
        console.warn('[Fallback] LOVABLE_API_KEY is missing, cannot run Gemini extraction');
      } else {
        scrapeMethod = 'failed';
      }
    }

    // ── Branding ─────────────────────────────────────────────────────
    // If we don't have branding from extract, try a quick scrape for it
    if (!brandingData) {
      try {
        const brandResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${firecrawlApiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url,
            formats: ['branding'],
            timeout: 15000,
            location: { country: 'BD' },
            skipTlsVerification: true,
          }),
        });
        const brandResult = await brandResponse.json();
        if (brandResponse.ok && brandResult.success) {
          brandingData = (brandResult.data || brandResult).branding || null;
        }
      } catch { /* branding is optional */ }
    }

    const brandImages = brandingData?.images as Record<string, unknown> | undefined;
    const brandColors = brandingData?.colors as Record<string, unknown> | undefined;
    const logoUrl = (brandingData?.logo as string) || (brandImages?.logo as string) || (brandImages?.favicon as string) || null;
    const primaryColor = (brandColors?.primary as string) || (brandColors?.accent as string) || categoryColors[categoryId] || '#006a4e';

    // ── Clean extracted data ─────────────────────────────────────────
    const rawContact = extractedInfo.contact_info as Record<string, unknown> | null;
    const cleanedContact = cleanContactInfo(rawContact);

    const cleanedSocialMedia = extractedInfo.social_media
      ? cleanContactInfo(extractedInfo.social_media as Record<string, unknown>)
      : null;

    // ── Quality gate ─────────────────────────────────────────────────
    const quality = computeContentQuality(extractedInfo);
    const hasDescription = !!extractedInfo.description;
    const hasServices = Array.isArray(extractedInfo.services) && extractedInfo.services.length > 0;
    const hasMeaningfulContent = hasDescription || hasServices;

    let scrapeStatus: string;
    let scrapeError: string | null = null;
    if (hasMeaningfulContent) {
      scrapeStatus = 'success';
    } else if (scrapeMethod === 'failed') {
      scrapeStatus = 'failed';
      scrapeError = 'All methods failed — site may be unreachable or blocked';
    } else {
      scrapeStatus = 'incomplete';
      scrapeError = 'Scraping ran but extracted no description or services';
    }

    console.log(`Quality: ${quality}, Status: ${scrapeStatus}, Method: ${scrapeMethod}`);

    // ── Save ─────────────────────────────────────────────────────────
    const siteData: Record<string, unknown> = {
      url,
      name,
      category_id: categoryId,
      description: (extractedInfo.description as string) || null,
      mission: (extractedInfo.mission as string) || null,
      services: extractedInfo.services || null,
      contact_info: cleanedContact,
      office_hours: isValidContactValue(extractedInfo.office_hours as string) ? (extractedInfo.office_hours as string) : null,
      related_links: extractedInfo.related_links || null,
      logo_url: logoUrl,
      primary_color: primaryColor,
      scrape_status: scrapeStatus,
      scrape_error: scrapeError,
      last_scraped_at: new Date().toISOString(),
      scrape_method: scrapeMethod,
      content_quality: quality,
      establishment_year: isValidContactValue(extractedInfo.establishment_year as string)
        ? (extractedInfo.establishment_year as string) : null,
      social_media: cleanedSocialMedia,
    };

    const { data: savedData, error: saveError } = await supabase
      .from('gov_site_details')
      .upsert(siteData, { onConflict: 'url' })
      .select()
      .single();

    if (saveError) {
      console.error('Save error:', saveError);

      // Retry without new columns in case migration hasn't been applied yet
      const { scrape_method: _sm, content_quality: _cq, establishment_year: _ey, social_media: _so, ...legacyData } = siteData;
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('gov_site_details')
        .upsert(legacyData, { onConflict: 'url' })
        .select()
        .single();

      if (fallbackError) {
        console.error('Legacy save also failed:', fallbackError);
        throw fallbackError;
      }

      console.log('Saved with legacy schema (new columns not yet migrated)');
      return new Response(
        JSON.stringify({ success: hasMeaningfulContent, data: fallbackData, method: scrapeMethod, quality }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    console.log(`=== Done: ${name} → ${scrapeStatus} (quality ${quality}) ===`);

    return new Response(
      JSON.stringify({ success: hasMeaningfulContent, data: savedData, method: scrapeMethod, quality }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('Error in scrape-gov-site:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
