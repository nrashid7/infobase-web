import { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: 'website' | 'article';
  jsonLd?: object;
}

export function SEO({
  title = 'INFOBASE - Bangladesh Government Services Guide',
  description = 'Navigate Bangladesh government services with confidence. Clear, verified guides for passport, NID, driving license, birth certificate, visa and more.',
  canonical,
  ogImage = 'https://lovable.dev/opengraph-image-p98pqg.png',
  ogType = 'website',
  jsonLd,
}: SEOProps) {
  useEffect(() => {
    // Update document title
    document.title = title;

    // Update or create meta tags
    const updateMeta = (name: string, content: string, property = false) => {
      const attr = property ? 'property' : 'name';
      let meta = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement;
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attr, name);
        document.head.appendChild(meta);
      }
      meta.content = content;
    };

    updateMeta('description', description);
    updateMeta('og:title', title, true);
    updateMeta('og:description', description, true);
    updateMeta('og:type', ogType, true);
    updateMeta('og:image', ogImage, true);
    updateMeta('twitter:title', title);
    updateMeta('twitter:description', description);
    updateMeta('twitter:image', ogImage);

    // Canonical link
    if (canonical) {
      let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'canonical';
        document.head.appendChild(link);
      }
      link.href = canonical;
    }

    // JSON-LD structured data
    if (jsonLd) {
      const existingScript = document.querySelector('script[data-seo-jsonld]');
      if (existingScript) {
        existingScript.remove();
      }
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-seo-jsonld', 'true');
      script.textContent = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }

    return () => {
      // Cleanup JSON-LD on unmount
      const script = document.querySelector('script[data-seo-jsonld]');
      if (script) script.remove();
    };
  }, [title, description, canonical, ogImage, ogType, jsonLd]);

  return null;
}

// Helper to generate Organization JSON-LD
export function generateOrganizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'INFOBASE',
    description: 'Bangladesh Government Services Guide',
    url: window.location.origin,
    logo: `${window.location.origin}/favicon.ico`,
  };
}

// Helper to generate WebSite JSON-LD
export function generateWebsiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'INFOBASE',
    url: window.location.origin,
    description: 'Navigate Bangladesh government services with confidence',
    potentialAction: {
      '@type': 'SearchAction',
      target: `${window.location.origin}/guides?search={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}

// Helper to generate HowTo JSON-LD for guides
export function generateHowToJsonLd(guide: {
  title: string;
  description: string;
  steps: { title: string; description: string }[];
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: guide.title,
    description: guide.description,
    step: guide.steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.title,
      text: step.description,
    })),
  };
}

// Helper to generate GovernmentService JSON-LD
export function generateGovServiceJsonLd(service: {
  name: string;
  description: string;
  url: string;
  provider?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'GovernmentService',
    name: service.name,
    description: service.description,
    url: service.url,
    serviceType: 'Government Service',
    provider: service.provider ? {
      '@type': 'GovernmentOrganization',
      name: service.provider,
    } : undefined,
  };
}
