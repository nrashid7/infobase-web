// Pure utility functions for gov sites - no Supabase dependency

// Generate a URL-safe slug from a site URL
export function getSiteSlug(url: string): string {
  try {
    const urlObj = new URL(url);
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
