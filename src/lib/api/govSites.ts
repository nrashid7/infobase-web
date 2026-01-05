import { supabase } from '@/integrations/supabase/client';

export interface GovSiteService {
  name: string;
  description: string;
}

export interface GovSiteContactInfo {
  phone?: string;
  email?: string;
  address?: string;
  fax?: string;
}

export interface GovSiteRelatedLink {
  title: string;
  url: string;
}

export interface GovSiteDetails {
  id: string;
  url: string;
  name: string;
  category_id: string;
  description?: string;
  mission?: string;
  services?: GovSiteService[];
  contact_info?: GovSiteContactInfo;
  office_hours?: string;
  related_links?: GovSiteRelatedLink[];
  logo_url?: string;
  primary_color?: string;
  last_scraped_at?: string;
  scrape_status: 'pending' | 'in_progress' | 'success' | 'failed';
  scrape_error?: string;
  created_at: string;
  updated_at: string;
}

export async function getSiteByUrl(url: string): Promise<GovSiteDetails | null> {
  const { data, error } = await supabase
    .from('gov_site_details')
    .select('*')
    .eq('url', url)
    .maybeSingle();

  if (error) {
    console.error('Error fetching site:', error);
    return null;
  }

  if (!data) return null;

  // Map database response to our type
  return {
    id: data.id,
    url: data.url,
    name: data.name,
    category_id: data.category_id,
    description: data.description ?? undefined,
    mission: data.mission ?? undefined,
    services: data.services as unknown as GovSiteService[] | undefined,
    contact_info: data.contact_info as unknown as GovSiteContactInfo | undefined,
    office_hours: data.office_hours ?? undefined,
    related_links: data.related_links as unknown as GovSiteRelatedLink[] | undefined,
    logo_url: data.logo_url ?? undefined,
    primary_color: data.primary_color ?? undefined,
    last_scraped_at: data.last_scraped_at ?? undefined,
    scrape_status: data.scrape_status as 'pending' | 'in_progress' | 'success' | 'failed',
    scrape_error: data.scrape_error ?? undefined,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
}

export async function scrapeSite(url: string, name: string, categoryId: string): Promise<{ success: boolean; data?: GovSiteDetails; error?: string }> {
  const { data, error } = await supabase.functions.invoke('scrape-gov-site', {
    body: { url, name, categoryId },
  });

  if (error) {
    console.error('Error scraping site:', error);
    return { success: false, error: error.message };
  }

  return data;
}

// Generate a URL-safe slug from a site URL
export function getSiteSlug(url: string): string {
  try {
    const urlObj = new URL(url);
    // Use hostname without www and protocol
    return urlObj.hostname.replace(/^www\./, '').replace(/\./g, '-');
  } catch {
    return encodeURIComponent(url);
  }
}

// Find site from directory by slug
export function findSiteBySlug(slug: string, directory: { links: { name: string; url: string }[] }[]): { name: string; url: string; categoryId: string } | null {
  for (const category of directory) {
    for (const link of category.links) {
      if (getSiteSlug(link.url) === slug) {
        return { ...link, categoryId: (category as { id?: string }).id || '' };
      }
    }
  }
  return null;
}
