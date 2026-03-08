import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

function extractTitle(html: string): string {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? match[1].trim().substring(0, 200) : '';
}

function normalizeForComparison(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function checkContentMatch(pageTitle: string, expectedName: string): boolean {
  if (!pageTitle || !expectedName) return true; // can't determine, assume ok
  
  const normalizedTitle = normalizeForComparison(pageTitle);
  const normalizedName = normalizeForComparison(expectedName);
  
  if (!normalizedTitle) return true; // empty title, can't determine
  
  // Check if any significant word from expected name appears in the title
  const nameWords = normalizedName.split(' ').filter(w => w.length > 3);
  if (nameWords.length === 0) return true;
  
  const matchCount = nameWords.filter(word => normalizedTitle.includes(word)).length;
  // If at least 30% of significant words match, consider it valid
  return matchCount >= Math.max(1, Math.ceil(nameWords.length * 0.3));
}

interface CheckResult {
  valid: boolean;
  status?: number;
  error?: string;
  pageTitle?: string;
  contentMatch?: boolean;
  finalUrl?: string;
}

async function checkUrl(url: string, expectedName?: string): Promise<CheckResult> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        redirect: 'follow',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });
      clearTimeout(timeoutId);
      
      let pageTitle = '';
      let contentMatch = true;
      
      if (response.ok) {
        try {
          const text = await response.text();
          pageTitle = extractTitle(text);
          if (expectedName && pageTitle) {
            contentMatch = checkContentMatch(pageTitle, expectedName);
          }
        } catch { /* ignore body read errors */ }
      }
      
      return {
        valid: response.status < 500,
        status: response.status,
        error: response.status >= 500 ? `Server error ${response.status}` : undefined,
        pageTitle,
        contentMatch,
        finalUrl: response.url,
      };
    } catch (directError) {
      clearTimeout(timeoutId);
      const errorMsg = directError instanceof Error ? directError.message : 'Unknown error';
      
      console.log(`Error for ${url}: ${errorMsg}`);
      
      // SSL/TLS errors - try HTTP fallback to get content
      if (errorMsg.includes('certificate') || errorMsg.includes('SSL') || errorMsg.includes('TLS') || 
          errorMsg.includes('UnknownIssuer') || errorMsg.includes('peer')) {
        
        // Try HTTP to check content
        if (url.startsWith('https://')) {
          const httpResult = await tryHttpFallback(url, expectedName);
          if (httpResult) return httpResult;
        }
        
        // SSL error with no HTTP fallback - mark as unverifiable
        return { valid: true, error: 'SSL issue - content unverifiable' };
      }
      
      // Timeout
      if (errorMsg.includes('aborted') || errorMsg.includes('timeout') || errorMsg.includes('signal') ||
          errorMsg.includes('The signal has been aborted')) {
        return { valid: false, error: 'Timeout - site unresponsive' };
      }
      
      // Connection refused
      if (errorMsg.includes('connection refused') || errorMsg.includes('reset') || 
          errorMsg.includes('Connection reset')) {
        return { valid: false, error: 'Connection refused' };
      }
      
      // DNS failures
      if (errorMsg.includes('dns error') || errorMsg.includes('NXDOMAIN') || 
          errorMsg.includes('Name or service not known') || errorMsg.includes('Temporary failure')) {
        return { valid: false, error: 'DNS resolution failed' };
      }
      
      // Try HTTP fallback for other errors
      if (url.startsWith('https://')) {
        const httpResult = await tryHttpFallback(url, expectedName);
        if (httpResult) return httpResult;
      }
      
      return { valid: false, error: errorMsg };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { valid: false, error: errorMessage };
  }
}

async function tryHttpFallback(httpsUrl: string, expectedName?: string): Promise<CheckResult | null> {
  const httpUrl = httpsUrl.replace('https://', 'http://');
  try {
    const httpController = new AbortController();
    const httpTimeoutId = setTimeout(() => httpController.abort(), 8000);
    
    const httpResponse = await fetch(httpUrl, {
      method: 'GET',
      signal: httpController.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    clearTimeout(httpTimeoutId);
    
    let pageTitle = '';
    let contentMatch = true;
    
    if (httpResponse.ok) {
      try {
        const text = await httpResponse.text();
        pageTitle = extractTitle(text);
        if (expectedName && pageTitle) {
          contentMatch = checkContentMatch(pageTitle, expectedName);
        }
      } catch { /* ignore */ }
    }
    
    return {
      valid: httpResponse.status < 500,
      status: httpResponse.status,
      pageTitle,
      contentMatch,
      finalUrl: httpResponse.url,
    };
  } catch {
    return null; // HTTP also failed
  }
}

// Process URLs with concurrency limit
async function processWithConcurrency(
  entries: Array<{ url: string; name?: string }>,
  limit: number
) {
  const results: Record<string, CheckResult> = {};
  let index = 0;

  async function next() {
    while (index < entries.length) {
      const entry = entries[index++];
      console.log(`Checking: ${entry.url}`);
      results[entry.url] = await checkUrl(entry.url, entry.name);
      console.log(`Result for ${entry.url}: ${JSON.stringify(results[entry.url])}`);
    }
  }

  const workers = Array.from({ length: Math.min(limit, entries.length) }, () => next());
  await Promise.all(workers);
  return results;
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { urls, entries } = body;
    
    // Support both old format (urls: string[]) and new format (entries: {url, name}[])
    let urlEntries: Array<{ url: string; name?: string }>;
    
    if (entries && Array.isArray(entries)) {
      urlEntries = entries;
    } else if (urls && Array.isArray(urls)) {
      urlEntries = urls.map((url: string) => ({ url }));
    } else {
      return new Response(
        JSON.stringify({ error: 'urls array or entries array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Validating ${urlEntries.length} URLs`);
    
    // Process with concurrency limit of 3
    const results = await processWithConcurrency(urlEntries, 3);

    const validCount = Object.values(results).filter(r => r.valid).length;
    const mismatchCount = Object.values(results).filter(r => r.contentMatch === false).length;
    console.log(`Validation complete: ${validCount}/${urlEntries.length} valid, ${mismatchCount} content mismatches`);

    return new Response(
      JSON.stringify({ results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
