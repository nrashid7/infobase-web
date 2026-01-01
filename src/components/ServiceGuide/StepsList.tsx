import { NormalizedClaim } from '@/lib/kbStore';
import { ClaimCard } from '../ClaimCard';
import { safeRender } from '@/lib/utils';

interface StepsListProps {
  claims: NormalizedClaim[];
}

function extractSteps(claim: NormalizedClaim): string[] {
  const text = claim.text || '';
  
  // Try to split by numbered patterns like "1.", "1)", "Step 1:"
  const numberedPattern = /(?:^|\n)\s*(?:\d+[.\):]|\bstep\s+\d+[.:\)]?)/gi;
  if (numberedPattern.test(text)) {
    const steps = text.split(/(?:^|\n)\s*(?:\d+[.\):]|\bstep\s+\d+[.:\)]?)/gi)
      .map(s => s.trim())
      .filter(s => s.length > 0);
    if (steps.length > 1) return steps;
  }
  
  // Try splitting by bullet points
  const bulletPattern = /(?:^|\n)\s*[•\-\*]/;
  if (bulletPattern.test(text)) {
    const steps = text.split(/(?:^|\n)\s*[•\-\*]/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
    if (steps.length > 1) return steps;
  }
  
  // Try splitting by line breaks
  const lines = text.split(/\n+/).map(s => s.trim()).filter(s => s.length > 0);
  if (lines.length > 1) return lines;
  
  return [];
}

export function StepsList({ claims }: StepsListProps) {
  // Combine all steps from all claims
  const allSteps: { step: string; claimId: string }[] = [];
  const unstructuredClaims: NormalizedClaim[] = [];
  
  claims.forEach(claim => {
    const steps = extractSteps(claim);
    if (steps.length > 0) {
      steps.forEach(step => {
        allSteps.push({ step, claimId: claim.id });
      });
    } else {
      unstructuredClaims.push(claim);
    }
  });

  // If we have structured steps, show as ordered list
  if (allSteps.length > 0) {
    return (
      <div className="space-y-4">
        <ol className="space-y-3 list-none">
          {allSteps.map((item, idx) => (
            <li key={idx} className="flex gap-3">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary font-medium text-sm flex items-center justify-center">
                {idx + 1}
              </span>
              <span className="text-foreground pt-0.5">{item.step}</span>
            </li>
          ))}
        </ol>
        
        {/* Show source citations */}
        <div className="space-y-3 mt-6">
          {claims.map((claim) => (
            <ClaimCard key={claim.id} claim={claim} />
          ))}
        </div>
      </div>
    );
  }

  // Fallback to regular claim cards
  return (
    <div className="space-y-3">
      {claims.map((claim) => (
        <ClaimCard key={claim.id} claim={claim} />
      ))}
    </div>
  );
}
