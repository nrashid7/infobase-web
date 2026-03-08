-- Enrich gov_site_details with additional columns for better scrape tracking and richer data

ALTER TABLE public.gov_site_details
  ADD COLUMN IF NOT EXISTS establishment_year TEXT,
  ADD COLUMN IF NOT EXISTS social_media JSONB,
  ADD COLUMN IF NOT EXISTS scrape_method TEXT,
  ADD COLUMN IF NOT EXISTS content_quality REAL;

-- scrape_method: tracks how data was obtained (firecrawl_extract, firecrawl+perplexity, perplexity_only, firecrawl_scrape)
-- content_quality: 0.0-1.0 score based on field completeness
-- establishment_year: year the organization was established
-- social_media: { facebook, twitter, youtube } profile URLs
