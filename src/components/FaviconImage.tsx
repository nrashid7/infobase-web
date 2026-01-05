import { useState, useEffect } from 'react';
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

// Cache for known broken favicon domains to avoid repeated 404s
const brokenFaviconCache = new Set<string>();

interface FaviconImageProps {
  url: string;
  className?: string;
  fallbackClassName?: string;
}

export function FaviconImage({ url, className, fallbackClassName }: FaviconImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const domain = getDomain(url);
  
  // Check if domain is known to have broken favicon
  useEffect(() => {
    if (domain && brokenFaviconCache.has(domain)) {
      setHasError(true);
      setIsLoading(false);
    }
  }, [domain]);
  
  const handleError = () => {
    if (domain) {
      brokenFaviconCache.add(domain);
    }
    setHasError(true);
    setIsLoading(false);
  };

  const handleLoad = () => {
    setIsLoading(false);
  };
  
  if (hasError || !domain) {
    return <Globe className={cn("w-4 h-4 text-muted-foreground", fallbackClassName)} />;
  }
  
  return (
    <>
      {isLoading && (
        <Globe className={cn("w-4 h-4 text-muted-foreground", fallbackClassName)} />
      )}
      <img
        src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
        alt=""
        className={cn("w-4 h-4", className, isLoading && "hidden")}
        onError={handleError}
        onLoad={handleLoad}
        loading="lazy"
        decoding="async"
      />
    </>
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
