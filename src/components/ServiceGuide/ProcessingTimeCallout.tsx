import { Clock } from 'lucide-react';
import { NormalizedClaim } from '@/lib/kbStore';
import { ClaimCard } from '../ClaimCard';
import { safeRender } from '@/lib/utils';

interface ProcessingTimeCalloutProps {
  claims: NormalizedClaim[];
}

export function ProcessingTimeCallout({ claims }: ProcessingTimeCalloutProps) {
  if (claims.length === 0) return null;

  // Combine texts for callout display
  const mainClaim = claims[0];
  
  return (
    <div className="space-y-4">
      {/* Callout banner */}
      <div className="flex items-center gap-4 p-4 bg-primary/5 border border-primary/20 rounded-lg">
        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <Clock className="w-6 h-6 text-primary" />
        </div>
        <div>
          <p className="font-medium text-foreground mb-1">Processing Time</p>
          <p className="text-muted-foreground">{safeRender(mainClaim.text)}</p>
        </div>
      </div>

      {/* Additional claims if any */}
      {claims.length > 1 && (
        <div className="space-y-3">
          {claims.slice(1).map((claim) => (
            <ClaimCard key={claim.id} claim={claim} />
          ))}
        </div>
      )}

      {/* Source citation for main claim */}
      <ClaimCard claim={mainClaim} />
    </div>
  );
}
