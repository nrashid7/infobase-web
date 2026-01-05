import { useState } from 'react';
import { Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

// Helper to extract domain from URL
const getDomain = (url: string): string => {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
};

interface FaviconImageProps {
  url: string;
  className?: string;
  fallbackClassName?: string;
}

export function FaviconImage({ url, className, fallbackClassName }: FaviconImageProps) {
  const [hasError, setHasError] = useState(false);
  const domain = getDomain(url);
  
  if (hasError || !domain) {
    return <Globe className={cn("w-4 h-4 text-muted-foreground", fallbackClassName)} />;
  }
  
  return (
    <img
      src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
      alt=""
      className={cn("w-4 h-4", className)}
      onError={() => setHasError(true)}
    />
  );
}

// Get the primary domain for an agency based on guide's official links or citations
export function getAgencyDomain(officialLinks?: Array<{ url: string }> | null): string | null {
  if (!officialLinks || officialLinks.length === 0) return null;
  
  // Get the first .gov.bd or .org.bd domain, or just the first domain
  for (const link of officialLinks) {
    try {
      const domain = new URL(link.url).hostname;
      if (domain.endsWith('.gov.bd') || domain.endsWith('.org.bd')) {
        return domain;
      }
    } catch {
      continue;
    }
  }
  
  // Fallback to first valid URL
  try {
    return new URL(officialLinks[0].url).hostname;
  } catch {
    return null;
  }
}
