import { ExternalLink, Globe } from 'lucide-react';
import { NormalizedClaim, NormalizedService, getSourcePageById } from '@/lib/kbStore';
import { Button } from '@/components/ui/button';

interface OfficialLinksGuideProps {
  service: NormalizedService;
  claims: NormalizedClaim[];
}

interface LinkItem {
  label: string;
  url: string;
  isPrimary: boolean;
}

function extractLinks(service: NormalizedService, claims: NormalizedClaim[]): LinkItem[] {
  const links: LinkItem[] = [];
  const seenUrls = new Set<string>();
  
  // Add service portal URL as primary
  if (service.portal_url && !seenUrls.has(service.portal_url)) {
    seenUrls.add(service.portal_url);
    links.push({
      label: 'Apply on official portal',
      url: service.portal_url,
      isPrimary: true,
    });
  }
  
  // Extract URLs from claims
  claims.forEach(claim => {
    const text = claim.text || '';
    const urlMatch = text.match(/https?:\/\/[^\s<>"{}|\\^`\[\]]+/gi);
    
    if (urlMatch) {
      urlMatch.forEach(url => {
        if (!seenUrls.has(url)) {
          seenUrls.add(url);
          
          // Determine label based on URL content
          let label = 'Official link';
          const urlLower = url.toLowerCase();
          if (urlLower.includes('status') || urlLower.includes('track')) {
            label = 'Check application status';
          } else if (urlLower.includes('apply') || urlLower.includes('application')) {
            label = 'Start application';
          } else if (urlLower.includes('help') || urlLower.includes('faq')) {
            label = 'Help & FAQ';
          }
          
          links.push({
            label,
            url,
            isPrimary: false,
          });
        }
      });
    }
    
    // Also add source page URLs
    claim.citations.forEach(cit => {
      const source = getSourcePageById(cit.source_page_id);
      if (source?.canonical_url && !seenUrls.has(source.canonical_url)) {
        seenUrls.add(source.canonical_url);
        links.push({
          label: 'View official page',
          url: source.canonical_url,
          isPrimary: false,
        });
      }
    });
  });
  
  return links;
}

export function OfficialLinksGuide({ service, claims }: OfficialLinksGuideProps) {
  const links = extractLinks(service, claims);
  
  if (links.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No official links available yet.
      </p>
    );
  }

  const primaryLink = links.find(l => l.isPrimary);
  const otherLinks = links.filter(l => !l.isPrimary).slice(0, 3);

  return (
    <div className="space-y-4">
      {primaryLink && (
        <Button asChild size="lg" className="w-full sm:w-auto">
          <a
            href={primaryLink.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Globe className="w-4 h-4 mr-2" />
            {primaryLink.label}
            <ExternalLink className="w-4 h-4 ml-2" />
          </a>
        </Button>
      )}
      
      {otherLinks.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {otherLinks.map((link, idx) => (
            <Button key={idx} variant="outline" size="sm" asChild>
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {link.label}
                <ExternalLink className="w-3 h-3 ml-1.5" />
              </a>
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
