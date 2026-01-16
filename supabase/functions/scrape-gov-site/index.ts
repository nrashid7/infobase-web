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

// Placeholder values to filter out from contact info
const invalidPatterns = [
  'not provided',
  'not available',
  'n/a',
  'na',
  'none',
  'null',
  'undefined',
  'contact us',
  'coming soon',
  'to be updated',
  'under construction',
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
      if (isValidContactValue(value)) {
        cleaned[key] = value.trim();
      }
    } else if (typeof value === 'object' && value !== null) {
      // Handle nested objects like { general: "email1", support: "email2" }
      const nestedCleaned: Record<string, string> = {};
      for (const [nestedKey, nestedValue] of Object.entries(value as Record<string, string>)) {
        if (typeof nestedValue === 'string' && isValidContactValue(nestedValue)) {
          nestedCleaned[nestedKey] = nestedValue.trim();
        }
      }
      if (Object.keys(nestedCleaned).length > 0) {
        cleaned[key] = nestedCleaned;
      }
    }
  }
  
  return Object.keys(cleaned).length > 0 ? cleaned : null;
}

// Category-based fallback colors
const categoryColors: Record<string, string> = {
  'core-government': '#006a4e',
  'key-ministries': '#1e3a5f',
  'public-services': '#0284c7',
  'e-governance': '#059669',
  'law-judiciary': '#1e3a5f',
  'economic-institutions': '#0f766e',
  'education-research': '#7c3aed',
  'health-services': '#0891b2',
  'agriculture-environment': '#16a34a',
  'energy-utilities': '#ea580c',
  'transport-infrastructure': '#475569',
  'communication-it': '#6366f1',
  'local-government': '#0d9488',
  'additional-ministries': '#4f46e5',
  'social-services': '#db2777',
  'planning-development': '#0284c7',
  'security-defense': '#3f6212',
  'regulatory-commissions': '#7c2d12',
  'disaster-emergency': '#dc2626',
  'maritime-ports': '#0369a1',
  'administrative-directory': '#6366f1',
};

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

    // Step 1: Try to scrape the website with multiple methods
    let scrapedData: { markdown?: string; branding?: Record<string, unknown> } = {};
    let scrapeSuccess = false;
    let scrapeMethod = '';
    const MIN_CONTENT_LENGTH = 500; // Minimum content length to consider scrape successful
    
    // Method 1: Try Firecrawl with branding first, then markdown-only with longer wait
    const tryConfigs = [
      { formats: ['markdown', 'branding'], waitFor: 5000 },
      { formats: ['markdown'], waitFor: 8000 },
      { formats: ['rawHtml'], waitFor: 10000 }, // Try rawHtml as last resort
    ];
    
    for (const config of tryConfigs) {
      try {
        console.log(`[Firecrawl] Trying formats: ${config.formats.join(', ')} with ${config.waitFor}ms wait`);
        const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${firecrawlApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url,
            formats: config.formats,
            onlyMainContent: config.formats.includes('rawHtml') ? false : true,
            waitFor: config.waitFor,
            timeout: 45000,
          }),
        });

        const scrapeResult = await scrapeResponse.json();
        
        if (scrapeResponse.ok && scrapeResult.success) {
          const data = scrapeResult.data || scrapeResult;
          const contentLength = (data.markdown?.length || 0) + (data.rawHtml?.length || 0);
          console.log(`[Firecrawl] Got content, length: ${contentLength}`);
          
          // Check if we got meaningful content
          if (contentLength >= MIN_CONTENT_LENGTH) {
            scrapedData = data;
            // If we only got rawHtml, use it as markdown for extraction
            if (!scrapedData.markdown && data.rawHtml) {
              // Extract text from HTML using a simple regex approach
              const htmlContent = data.rawHtml as string;
              const textContent = htmlContent
                .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                .replace(/<[^>]+>/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
              scrapedData.markdown = textContent;
              console.log(`[Firecrawl] Extracted ${textContent.length} chars from rawHtml`);
            }
            scrapeSuccess = true;
            scrapeMethod = 'firecrawl';
            break;
          } else {
            console.warn(`[Firecrawl] Content too short (${contentLength}), trying next method`);
          }
        } else {
          console.warn(`[Firecrawl] Format ${config.formats.join(', ')} failed:`, scrapeResult.error);
        }
      } catch (scrapeError) {
        console.warn(`[Firecrawl] Format ${config.formats.join(', ')} threw error:`, scrapeError);
      }
    }
    
    // Method 2: If Firecrawl fails or returns minimal content, use Perplexity search
    if (!scrapeSuccess || (scrapedData.markdown?.length || 0) < MIN_CONTENT_LENGTH) {
      console.log('[Perplexity] Firecrawl insufficient, using Perplexity for comprehensive research...');
      try {
        const perplexitySearchResponse = await fetch('https://api.perplexity.ai/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${perplexityApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'sonar-pro',
            messages: [
              { 
                role: 'system', 
                content: 'You are a research assistant specializing in Bangladesh government organizations. Provide comprehensive, factual information. Include specific phone numbers, email addresses, and physical addresses when available. Be thorough and detailed.' 
              },
              { 
                role: 'user', 
                content: `Research "${name}" - the official Bangladesh government website at ${url}. Provide detailed and accurate information about:

1. **Description**: What does this organization do? What is its role in Bangladesh government? (2-3 detailed sentences)

2. **Mission/Vision**: What is their stated mission or vision? Quote it if available.

3. **Services** (list at least 4-6 specific services):
   - What specific services do they provide to citizens?
   - What processes can be done through this organization?

4. **Contact Information** (be specific with real numbers/emails):
   - Phone numbers (include country code +880)
   - Email addresses
   - Physical address (full address with postal code)
   - Fax numbers if available

5. **Office Hours**: What are their working hours?

6. **Important Links**: What are the key subpages or related government websites?

Please provide real, verifiable information. If something is not available, say "Information not found" rather than guessing.`
              }
            ],
          }),
        });

        const perplexitySearchResult = await perplexitySearchResponse.json();
        
        if (perplexitySearchResponse.ok && perplexitySearchResult.choices?.[0]?.message?.content) {
          const content = perplexitySearchResult.choices[0].message.content;
          console.log('[Perplexity] Research successful, content length:', content.length);
          
          // Combine with any Firecrawl data we got
          if (scrapedData.markdown) {
            scrapedData.markdown = content + '\n\n--- Website Content ---\n\n' + scrapedData.markdown;
          } else {
            scrapedData.markdown = content;
          }
          scrapeSuccess = true;
          scrapeMethod = scrapeSuccess ? 'firecrawl+perplexity' : 'perplexity';
        } else {
          console.warn('[Perplexity] Research failed:', perplexitySearchResult.error || 'No content');
        }
      } catch (perplexityError) {
        console.warn('[Perplexity] Research threw error:', perplexityError);
      }
    }
    
    // If all methods fail, save error and return
    if (!scrapeSuccess) {
      console.error('All scrape methods failed for:', url);
      
      await supabase.from('gov_site_details').update({
        scrape_status: 'failed',
        scrape_error: 'All methods failed (Firecrawl + Perplexity) - site may be unreachable',
        last_scraped_at: new Date().toISOString(),
      }).eq('url', url);

      return new Response(
        JSON.stringify({ success: false, error: 'Failed to scrape website with all available methods' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`Scrape successful via ${scrapeMethod}, total content: ${scrapedData.markdown?.length || 0} chars`);
    

    // Step 2: Use Perplexity to extract structured information with improved prompt
    const markdown = scrapedData.markdown || '';
    const truncatedMarkdown = markdown.slice(0, 8000);

    const extractionPrompt = `Analyze this Bangladesh government website content and extract structured information. Return a JSON object with these fields:

CRITICAL INSTRUCTIONS:
- Only include REAL, VERIFIED information found in the content
- For contact_info: Include ONLY actual phone numbers (format: +880-XX-XXXXXXXX or similar), real email addresses (must contain @), and complete physical addresses
- DO NOT include placeholder text like "Not provided", "N/A", "Contact us", etc.
- If information is not found, use null instead of placeholder text
- Phone numbers should be formatted consistently with country code when possible
- Addresses should include full location details when available

JSON structure:
{
  "description": "2-3 sentence description of what this organization does (be specific and informative)",
  "mission": "Their mission statement if explicitly mentioned, otherwise null",
  "services": [{"name": "Service Name", "description": "Brief description of service"}] (max 6, include only clearly defined services),
  "contact_info": {
    "phone": "Actual phone number(s) or null",
    "email": "Actual email address(es) or null", 
    "address": "Complete physical address or null",
    "fax": "Fax number if available or null"
  },
  "office_hours": "Office hours if mentioned, otherwise null",
  "related_links": [{"title": "Link Title", "url": "https://..."}] (max 5, only include valid URLs)
}

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
            { role: 'system', content: 'You are a helpful assistant that extracts structured information from website content. Always return valid JSON. Never include placeholder text like "Not provided" or "N/A" - use null instead.' },
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
    }

    // Step 3: Extract and validate branding info
    const branding = scrapedData.branding as Record<string, unknown> | undefined;
    const brandingImages = branding?.images as Record<string, unknown> | undefined;
    const brandingColors = branding?.colors as Record<string, unknown> | undefined;
    
    // Try multiple sources for logo
    let logoUrl = (branding?.logo as string) || 
                  (brandingImages?.logo as string) || 
                  (brandingImages?.favicon as string) ||
                  null;
    
    // Try multiple sources for primary color, with category fallback
    let primaryColor = (brandingColors?.primary as string) || 
                       (brandingColors?.accent as string) ||
                       categoryColors[categoryId] ||
                       '#006a4e'; // Default Bangladesh green

    // Clean the contact info to remove placeholder values
    const rawContactInfo = extractedInfo.contact_info as Record<string, unknown> | null;
    const cleanedContactInfo = cleanContactInfo(rawContactInfo);

    // Step 4: Save to database
    const siteData = {
      url,
      name,
      category_id: categoryId,
      description: extractedInfo.description as string || null,
      mission: extractedInfo.mission as string || null,
      services: extractedInfo.services || null,
      contact_info: cleanedContactInfo,
      office_hours: isValidContactValue(extractedInfo.office_hours as string) 
        ? extractedInfo.office_hours as string 
        : null,
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
