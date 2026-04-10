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

export interface GovSiteSocialMedia {
  facebook?: string;
  twitter?: string;
  youtube?: string;
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
  scrape_status: 'pending' | 'in_progress' | 'success' | 'failed' | 'incomplete';
  scrape_error?: string;
  scrape_method?: string;
  content_quality?: number;
  establishment_year?: string;
  social_media?: GovSiteSocialMedia;
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
    scrape_status: data.scrape_status as GovSiteDetails['scrape_status'],
    scrape_error: data.scrape_error ?? undefined,
    scrape_method: (data as Record<string, unknown>).scrape_method as string | undefined,
    content_quality: (data as Record<string, unknown>).content_quality as number | undefined,
    establishment_year: (data as Record<string, unknown>).establishment_year as string | undefined,
    social_media: (data as Record<string, unknown>).social_media as unknown as GovSiteSocialMedia | undefined,
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
// Re-export utilities for backwards compatibility
export { getSiteSlug, findSiteBySlug } from './govSiteUtils';
