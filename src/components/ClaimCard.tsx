import { ExternalLink } from 'lucide-react';
import { NormalizedClaim, getSourcePageById } from '@/lib/kbStore';
import { StatusBadge } from './StatusBadge';
import { cn, formatLocator, safeRender } from '@/lib/utils';
import { generateClaimTitle } from '@/lib/citizenLabels';

interface ClaimCardProps {
  claim: NormalizedClaim;
  className?: string;
}

export function ClaimCard({ claim, className }: ClaimCardProps) {
  const title = generateClaimTitle(claim);
  const source = claim.citations[0] ? getSourcePageById(claim.citations[0].source_page_id) : undefined;

  return (
    <div className={cn("bg-card border border-border rounded-lg p-4", className)}>
      <div className="flex items-start justify-between gap-4 mb-2">
        <h4 className="font-medium text-foreground">{title}</h4>
        <StatusBadge status={claim.status} />
      </div>
      
      <p className="text-muted-foreground text-sm mb-3">{safeRender(claim.text)}</p>

      {source?.canonical_url && (
        <a
          href={source.canonical_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          <ExternalLink className="w-3 h-3" />
          Official source
        </a>
      )}
    </div>
  );
}
