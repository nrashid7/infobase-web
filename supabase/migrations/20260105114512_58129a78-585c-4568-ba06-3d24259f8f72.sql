-- Create table for storing scraped government site details
CREATE TABLE public.gov_site_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category_id TEXT NOT NULL,
  
  -- Scraped/AI-generated content
  description TEXT,
  mission TEXT,
  services JSONB, -- Array of {name, description}
  contact_info JSONB, -- {phone, email, address, fax}
  office_hours TEXT,
  related_links JSONB, -- Array of {title, url}
  
  -- Branding
  logo_url TEXT,
  primary_color TEXT,
  
  -- Metadata
  last_scraped_at TIMESTAMPTZ,
  scrape_status TEXT DEFAULT 'pending', -- pending, in_progress, success, failed
  scrape_error TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.gov_site_details ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (no auth required - this is public data)
CREATE POLICY "Anyone can view gov site details" 
ON public.gov_site_details 
FOR SELECT 
USING (true);

-- Create policy for service role to insert/update (edge functions)
CREATE POLICY "Service role can manage gov site details" 
ON public.gov_site_details 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create index for faster lookups by URL
CREATE INDEX idx_gov_site_details_url ON public.gov_site_details(url);

-- Create index for category filtering
CREATE INDEX idx_gov_site_details_category ON public.gov_site_details(category_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_gov_site_details_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_gov_site_details_updated_at
BEFORE UPDATE ON public.gov_site_details
FOR EACH ROW
EXECUTE FUNCTION public.update_gov_site_details_updated_at();