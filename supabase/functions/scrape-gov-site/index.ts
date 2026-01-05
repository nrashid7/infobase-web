import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScrapeRequest {
  url: string;
  name: string;
  categoryId: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, name, categoryId } = await req.json() as ScrapeRequest;

    if (!url || !name || !categoryId) {
      return new Response(
        JSON.stringify({ success: false, error: 'URL, name, and categoryId are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
    const perplexityApiKey = Deno.env.get('PERPLEXITY_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!firecrawlApiKey) {
      console.error('FIRECRAWL_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl connector not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!perplexityApiKey) {
      console.error('PERPLEXITY_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Perplexity connector not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

    // Update status to in_progress
    await supabase.from('gov_site_details').upsert({
      url,
      name,
      category_id: categoryId,
      scrape_status: 'in_progress',
    }, { onConflict: 'url' });

    console.log('Scraping URL:', url);

    // Step 1: Scrape the website with Firecrawl
    let scrapedData: { markdown?: string; branding?: Record<string, unknown> } = {};
    
    // Try with branding first, fall back to markdown-only if it fails
    const tryFormats = [['markdown', 'branding'], ['markdown']];
    let scrapeSuccess = false;
    
    for (const formats of tryFormats) {
      try {
        console.log(`Trying formats: ${formats.join(', ')}`);
        const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${firecrawlApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url,
            formats,
            onlyMainContent: true,
            waitFor: 5000,
            timeout: 30000,
          }),
        });

        const scrapeResult = await scrapeResponse.json();
        
        if (scrapeResponse.ok && scrapeResult.success) {
          scrapedData = scrapeResult.data || scrapeResult;
          console.log('Scrape successful, markdown length:', scrapedData.markdown?.length || 0);
          scrapeSuccess = true;
          break;
        } else {
          console.warn(`Format ${formats.join(', ')} failed:`, scrapeResult.error);
        }
      } catch (scrapeError) {
        console.warn(`Format ${formats.join(', ')} threw error:`, scrapeError);
      }
    }
    
    if (!scrapeSuccess) {
      console.error('All scrape attempts failed for:', url);
      
      await supabase.from('gov_site_details').update({
        scrape_status: 'failed',
        scrape_error: 'All scrape formats failed - site may be unreachable or blocking scrapers',
        last_scraped_at: new Date().toISOString(),
      }).eq('url', url);

      return new Response(
        JSON.stringify({ success: false, error: 'Failed to scrape website after retries' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 2: Use Perplexity to extract structured information
    const markdown = scrapedData.markdown || '';
    const truncatedMarkdown = markdown.slice(0, 8000); // Limit context size

    const extractionPrompt = `Analyze this government website content and extract structured information. Return a JSON object with these fields:
- description: A 2-3 sentence description of what this organization does
- mission: Their mission statement if available
- services: Array of {name, description} for main services offered (max 5)
- contact_info: Object with phone, email, address, fax if found
- office_hours: Office hours if mentioned
- related_links: Array of {title, url} for important related links (max 5)

Website: ${name}
URL: ${url}

Content:
${truncatedMarkdown}

Return ONLY valid JSON, no explanation.`;

    let extractedInfo: Record<string, unknown> = {};
    try {
      const perplexityResponse = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${perplexityApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'sonar',
          messages: [
            { role: 'system', content: 'You are a helpful assistant that extracts structured information from website content. Always return valid JSON.' },
            { role: 'user', content: extractionPrompt }
          ],
        }),
      });

      const perplexityResult = await perplexityResponse.json();
      
      if (!perplexityResponse.ok) {
        console.error('Perplexity error:', perplexityResult);
        throw new Error('Failed to extract information');
      }

      const content = perplexityResult.choices?.[0]?.message?.content || '';
      
      // Try to parse JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        extractedInfo = JSON.parse(jsonMatch[0]);
      }
      
      console.log('Extraction successful');
    } catch (extractError) {
      console.error('Extraction failed:', extractError);
      // Continue with partial data if extraction fails
    }

    // Step 3: Extract branding info
    const branding = scrapedData.branding as Record<string, unknown> | undefined;
    const brandingImages = branding?.images as Record<string, unknown> | undefined;
    const brandingColors = branding?.colors as Record<string, unknown> | undefined;
    const logoUrl = (branding?.logo as string) || (brandingImages?.logo as string) || null;
    const primaryColor = (brandingColors?.primary as string) || null;

    // Step 4: Save to database
    const siteData = {
      url,
      name,
      category_id: categoryId,
      description: extractedInfo.description as string || null,
      mission: extractedInfo.mission as string || null,
      services: extractedInfo.services || null,
      contact_info: extractedInfo.contact_info || null,
      office_hours: extractedInfo.office_hours as string || null,
      related_links: extractedInfo.related_links || null,
      logo_url: logoUrl,
      primary_color: primaryColor,
      scrape_status: 'success',
      scrape_error: null,
      last_scraped_at: new Date().toISOString(),
    };

    const { data: savedData, error: saveError } = await supabase
      .from('gov_site_details')
      .upsert(siteData, { onConflict: 'url' })
      .select()
      .single();

    if (saveError) {
      console.error('Save error:', saveError);
      throw saveError;
    }

    console.log('Site details saved successfully');

    return new Response(
      JSON.stringify({ success: true, data: savedData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in scrape-gov-site:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
