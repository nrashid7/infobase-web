const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { guideId, serviceName, agencyName, officialUrl } = await req.json() as ResearchRequest;

    if (!guideId || !serviceName) {
      return new Response(
        JSON.stringify({ success: false, error: 'guideId and serviceName are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('PERPLEXITY_API_KEY');
    if (!apiKey) {
      console.error('PERPLEXITY_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Perplexity connector not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Researching guide: ${serviceName} from ${agencyName}`);

    // Build comprehensive research query
    const researchQuery = `
Bangladesh ${serviceName} complete guide 2024-2025:
- Official application process step by step
- Required documents list
- Fees and payment options (Regular, Express, Super Express if available)
- Processing time for each option
- Eligibility requirements  
- Official portal URL and online services
- Important tips and common mistakes to avoid

Focus on information from ${officialUrl || 'official government sources'} and ${agencyName}.
Provide specific amounts in BDT and exact processing times in working days where available.
    `.trim();

    // Call Perplexity API for comprehensive research
    const perplexityResponse = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar-pro',
        messages: [
          {
            role: 'system',
            content: `You are an expert researcher specializing in Bangladesh government services. 
Your task is to provide comprehensive, accurate, and up-to-date information about government procedures.
Always cite specific sources and provide exact figures (fees in BDT, processing times in days).
Structure your response clearly with sections for each aspect of the service.`
          },
          {
            role: 'user',
            content: researchQuery
          }
        ],
        search_domain_filter: officialUrl ? [new URL(officialUrl).hostname] : undefined,
        return_citations: true,
      }),
    });

    if (!perplexityResponse.ok) {
      const errorText = await perplexityResponse.text();
      console.error('Perplexity API error:', perplexityResponse.status, errorText);
      return new Response(
        JSON.stringify({ success: false, error: `Perplexity API error: ${perplexityResponse.status}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const perplexityData = await perplexityResponse.json();
    const researchContent = perplexityData.choices?.[0]?.message?.content || '';
    const citations = perplexityData.citations || [];

    console.log('Research completed, parsing content...');

    // Now use Perplexity again to extract structured data
    const extractionResponse = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          {
            role: 'system',
            content: `You are a JSON data extractor. Extract structured data from the research content and output valid JSON only.
Do not include any text outside the JSON object.`
          },
          {
            role: 'user',
            content: `Extract the following structured data from this research about ${serviceName}:

${researchContent}

Output a JSON object with this structure:
{
  "overview": "One paragraph summary of the service",
  "steps": [
    { "step_number": 1, "title": "Step title", "description": "Detailed step description" }
  ],
  "eligibility": [
    { "label": "Eligibility requirement", "description": "Details if any" }
  ],
  "required_documents": [
    { "label": "Document name", "description": "Details about the document" }
  ],
  "fees": {
    "regular": { "amount_bdt": 0, "delivery_days": 0 },
    "express": { "amount_bdt": 0, "delivery_days": 0 },
    "super_express": { "amount_bdt": 0, "delivery_days": 0 }
  },
  "processing_time": [
    { "label": "Processing type", "description": "X working days" }
  ],
  "tips": [
    { "label": "Tip title", "description": "Tip details" }
  ],
  "official_links": [
    { "label": "Link name", "url": "https://..." }
  ]
}

Use null for any fields where data is not available. Include only actual data from the research.`
          }
        ],
      }),
    });

    if (!extractionResponse.ok) {
      console.error('Extraction API error:', extractionResponse.status);
      // Return raw research if extraction fails
      return new Response(
        JSON.stringify({ 
          success: true, 
          rawContent: researchContent,
          citations,
          structured: null 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const extractionData = await extractionResponse.json();
    let extractedContent = extractionData.choices?.[0]?.message?.content || '';
    
    // Try to parse the JSON
    let structuredData = null;
    try {
      // Clean up the response - remove markdown code blocks if present
      extractedContent = extractedContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      structuredData = JSON.parse(extractedContent);
    } catch (e) {
      console.error('Failed to parse extracted JSON:', e);
    }

    // Build the final guide data
    const now = new Date().toISOString();
    const sourceDomains = citations.map((c: string) => {
      try {
        return new URL(c).hostname;
      } catch {
        return c;
      }
    }).filter((d: string, i: number, arr: string[]) => arr.indexOf(d) === i);

    // Create citations array from Perplexity citations
    const buildCitation = (url: string, text?: string): Citation => ({
      source_page_id: `source.${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      canonical_url: url,
      domain: (() => { try { return new URL(url).hostname; } catch { return url; } })(),
      page_title: serviceName,
      locator: 'Perplexity Research',
      quoted_text: text || '',
      retrieved_at: now,
      language: 'en'
    });

    const primaryCitations: Citation[] = citations.slice(0, 3).map((c: string) => buildCitation(c));

    // Build steps with citations
    const steps: Step[] = (structuredData?.steps || []).map((s: any, idx: number) => ({
      step_number: s.step_number || idx + 1,
      title: s.title || `Step ${idx + 1}`,
      description: s.description || '',
      citations: primaryCitations
    }));

    // Build section items
    const buildSectionItems = (items: any[]): SectionItem[] => 
      (items || []).map(item => ({
        label: item.label || item,
        description: item.description || null,
        citations: primaryCitations
      }));

    // Build variants and fees
    const variants: Variant[] = [];
    const feesData = structuredData?.fees || {};
    
    if (feesData.regular?.amount_bdt) {
      variants.push({
        variant_id: 'regular',
        label: 'Regular',
        fees: [{
          text: `Regular delivery: ৳${feesData.regular.amount_bdt}`,
          structured_data: {
            amount_bdt: feesData.regular.amount_bdt,
            delivery_type: 'regular',
            pages: null,
            delivery_days: feesData.regular.delivery_days || null,
            validity_years: null
          },
          citations: primaryCitations
        }],
        processing_times: feesData.regular.delivery_days ? [{
          text: `${feesData.regular.delivery_days} working days`,
          citations: primaryCitations
        }] : []
      });
    }

    if (feesData.express?.amount_bdt) {
      variants.push({
        variant_id: 'express',
        label: 'Express',
        fees: [{
          text: `Express delivery: ৳${feesData.express.amount_bdt}`,
          structured_data: {
            amount_bdt: feesData.express.amount_bdt,
            delivery_type: 'express',
            pages: null,
            delivery_days: feesData.express.delivery_days || null,
            validity_years: null
          },
          citations: primaryCitations
        }],
        processing_times: feesData.express.delivery_days ? [{
          text: `${feesData.express.delivery_days} working days`,
          citations: primaryCitations
        }] : []
      });
    }

    if (feesData.super_express?.amount_bdt) {
      variants.push({
        variant_id: 'super_express',
        label: 'Super Express',
        fees: [{
          text: `Super Express delivery: ৳${feesData.super_express.amount_bdt}`,
          structured_data: {
            amount_bdt: feesData.super_express.amount_bdt,
            delivery_type: 'super_express',
            pages: null,
            delivery_days: feesData.super_express.delivery_days || null,
            validity_years: null
          },
          citations: primaryCitations
        }],
        processing_times: feesData.super_express.delivery_days ? [{
          text: `${feesData.super_express.delivery_days} working days`,
          citations: primaryCitations
        }] : []
      });
    }

    // Build flat fees list
    const fees: FeeItem[] = variants.map(v => ({
      label: v.fees[0]?.text || v.label,
      description: v.processing_times[0]?.text || null,
      citations: primaryCitations
    }));

    // Build official links
    const officialLinks: OfficialLink[] = [
      ...(officialUrl ? [{ label: 'Official Portal', url: officialUrl, source_page_id: primaryCitations[0]?.source_page_id || '' }] : []),
      ...(structuredData?.official_links || []).map((l: any) => ({
        label: l.label || 'Official Link',
        url: l.url,
        source_page_id: primaryCitations[0]?.source_page_id || ''
      }))
    ].filter((l, i, arr) => arr.findIndex(x => x.url === l.url) === i);

    const guideData: GuideData = {
      guide_id: guideId,
      service_id: guideId.replace('guide.', 'svc.'),
      agency_id: `agency.${agencyName.toLowerCase().replace(/[^a-z]/g, '').substring(0, 10)}`,
      agency_name: agencyName,
      title: serviceName,
      overview: structuredData?.overview || null,
      steps,
      sections: {
        eligibility: buildSectionItems(structuredData?.eligibility),
        required_documents: buildSectionItems(structuredData?.required_documents),
        fees,
        processing_time: buildSectionItems(structuredData?.processing_time),
        service_info: buildSectionItems(structuredData?.tips)
      },
      variants,
      required_documents: buildSectionItems(structuredData?.required_documents),
      fees,
      official_links: officialLinks,
      meta: {
        total_steps: steps.length,
        total_citations: primaryCitations.length * (steps.length + fees.length + (structuredData?.required_documents?.length || 0)),
        last_crawled_at: now,
        source_domains: sourceDomains,
        generated_at: now,
        last_updated_at: now,
        status: 'researched'
      }
    };

    console.log('Guide research completed successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        guide: guideData,
        rawContent: researchContent,
        citations 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Research error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to research guide';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
