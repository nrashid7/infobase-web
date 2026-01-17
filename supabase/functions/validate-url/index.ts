import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    const results: Record<string, { valid: boolean; status?: number; error?: string }> = {};

    // Check each URL with a timeout
    await Promise.all(urls.map(async (url: string) => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(url, {
          method: 'HEAD',
          signal: controller.signal,
          redirect: 'follow',
        });

        clearTimeout(timeoutId);
        
        results[url] = {
          valid: response.status >= 200 && response.status < 400,
          status: response.status,
        };
      } catch (error) {
        // Try GET if HEAD fails (some servers don't support HEAD)
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000);

          const response = await fetch(url, {
            method: 'GET',
            signal: controller.signal,
            redirect: 'follow',
          });

          clearTimeout(timeoutId);
          
          results[url] = {
            valid: response.status >= 200 && response.status < 400,
            status: response.status,
          };
        } catch (getError) {
          const errorMessage = getError instanceof Error ? getError.message : 'Unknown error';
          results[url] = {
            valid: false,
            error: errorMessage,
          };
        }
      }
    }));

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
