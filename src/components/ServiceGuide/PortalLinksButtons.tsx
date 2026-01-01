import { ExternalLink } from 'lucide-react';
import { NormalizedClaim, getSourcePageById } from '@/lib/kbStore';
import { Button } from '@/components/ui/button';
import { ClaimCard } from '../ClaimCard';
import { safeRender } from '@/lib/utils';

interface PortalLinksButtonsProps {
  claims: NormalizedClaim[];
}

interface PortalLink {
  label: string;
  url: string;
  claim: NormalizedClaim;
}

function extractPortalLinks(claim: NormalizedClaim): PortalLink[] {
  const links: PortalLink[] = [];
  
  // Check structured_data first
  if (claim.structured_data?.url) {
    links.push({
      label: claim.summary || claim.text || 'Official Portal',
      url: claim.structured_data.url,
      claim
    });
    return links;
  }
  
  // Try to extract URL from text
  const urlMatch = claim.text?.match(/https?:\/\/[^\s<>"{}|\\^`\[\]]+/);
  if (urlMatch) {
    links.push({
      label: claim.summary || 'Official Portal',
      url: urlMatch[0],
      claim
    });
    return links;
  }
  
  // Use source page URL as fallback
  claim.citations.forEach(cit => {
    const sourcePage = getSourcePageById(cit.source_page_id);
    if (sourcePage?.canonical_url) {
      const label = claim.summary || claim.text || 'Visit official page';
      // Dedupe
      if (!links.find(l => l.url === sourcePage.canonical_url)) {
        links.push({
          label: label.slice(0, 50),
          url: sourcePage.canonical_url,
          claim
        });
      }
    }
  });
  
  return links;
}

export function PortalLinksButtons({ claims }: PortalLinksButtonsProps) {
  // Extract all portal links
  const allLinks: PortalLink[] = [];
  claims.forEach(claim => {
    const links = extractPortalLinks(claim);
    links.forEach(link => {
      if (!allLinks.find(l => l.url === link.url)) {
        allLinks.push(link);
      }
    });
  });

  if (allLinks.length === 0) {
    // Fallback to regular cards
    return (
      <div className="space-y-3">
        {claims.map((claim) => (
          <ClaimCard key={claim.id} claim={claim} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Portal link buttons */}
      <div className="flex flex-wrap gap-3">
        {allLinks.map((link, idx) => (
          <Button
            key={idx}
            asChild
            variant="default"
            className="gap-2"
          >
            <a href={link.url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4" />
              {link.label.length > 30 ? link.label.slice(0, 30) + '...' : link.label}
            </a>
          </Button>
        ))}
      </div>

      {/* Source citations */}
      <div className="space-y-3 mt-4">
        {claims.map((claim) => (
          <ClaimCard key={claim.id} claim={claim} />
        ))}
      </div>
    </div>
  );
}
