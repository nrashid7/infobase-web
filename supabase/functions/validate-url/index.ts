import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Use an external service to check URL accessibility
async function checkUrlViaExternalService(url: string): Promise<{ valid: boolean; status?: number; error?: string }> {
  try {
    // Try using a public DNS check or HTTP checker API
    // We'll try multiple approaches
    
    // Approach 1: Try direct fetch with relaxed TLS (Deno limitation)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

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
      
      // Any response means the site exists
      return {
        valid: true,
        status: response.status,
      };
    } catch (directError) {
      clearTimeout(timeoutId);
      const errorMsg = directError instanceof Error ? directError.message : 'Unknown error';
      
      console.log(`Error for ${url}: ${errorMsg}`);
      
      // Check if it's a certificate error - site exists but has SSL issues
      if (errorMsg.includes('certificate') || errorMsg.includes('SSL') || errorMsg.includes('TLS') || 
          errorMsg.includes('UnknownIssuer') || errorMsg.includes('peer')) {
        return {
          valid: true, // Site exists, just has SSL issues
          error: 'SSL certificate issue (site exists)',
        };
      }
      
      // Timeout/abort - likely just slow, assume exists
      if (errorMsg.includes('aborted') || errorMsg.includes('timeout') || errorMsg.includes('signal') ||
          errorMsg.includes('The signal has been aborted')) {
        return {
          valid: true, // Assume exists but slow
          error: 'Timeout (server may be slow)',
        };
      }
      
      // Connection refused/reset means server exists but rejected connection
      if (errorMsg.includes('connection refused') || errorMsg.includes('reset') || 
          errorMsg.includes('Connection reset')) {
        return {
          valid: true, // Server exists
          error: 'Connection refused (server exists)',
        };
      }
      
      // Temporary DNS failures could be infrastructure issues, not missing domains
      // Check this BEFORE the general DNS check
      if (errorMsg.includes('Temporary failure')) {
        return {
          valid: true, // Assume exists - temporary failures are common
          error: 'DNS temporarily unavailable (likely exists)',
        };
      }
      
      // True DNS failure - domain doesn't exist
      // "Name or service not known" without "Temporary" = domain doesn't exist
      if (errorMsg.includes('dns error') || errorMsg.includes('NXDOMAIN') || 
          errorMsg.includes('Name or service not known')) {
        return {
          valid: false,
          error: 'Domain does not exist',
        };
      }
      
      // For other errors, try HTTP (non-HTTPS)
      if (url.startsWith('https://')) {
        const httpUrl = url.replace('https://', 'http://');
        try {
          const httpController = new AbortController();
          const httpTimeoutId = setTimeout(() => httpController.abort(), 10000);
          
          const httpResponse = await fetch(httpUrl, {
            method: 'GET',
            signal: httpController.signal,
            redirect: 'follow',
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
          });
          clearTimeout(httpTimeoutId);
          
          return {
            valid: true,
            status: httpResponse.status,
          };
        } catch {
          // HTTP also failed
        }
      }
      
      // If we can't determine, assume it might exist (false positives are better than false negatives)
      return {
        valid: false,
        error: errorMsg,
      };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      valid: false,
      error: errorMessage,
    };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { urls } = await req.json();
    
    if (!urls || !Array.isArray(urls)) {
      return new Response(
        JSON.stringify({ error: 'urls array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Validating ${urls.length} URLs`);
    
    const results: Record<string, { valid: boolean; status?: number; error?: string }> = {};

    // Check each URL
    await Promise.all(urls.map(async (url: string) => {
      console.log(`Checking: ${url}`);
      results[url] = await checkUrlViaExternalService(url);
      console.log(`Result for ${url}: ${JSON.stringify(results[url])}`);
    }));

    const validCount = Object.values(results).filter(r => r.valid).length;
    console.log(`Validation complete: ${validCount}/${urls.length} valid`);

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
