import { ExternalLink } from 'lucide-react';
import { NormalizedClaim, getSourcePageById } from '@/lib/kbStore';

interface StepCardsProps {
  claims: NormalizedClaim[];
}

interface Step {
  number: number;
  instruction: string;
  sourceUrl?: string;
}

function extractStepsFromClaims(claims: NormalizedClaim[]): Step[] {
  const steps: Step[] = [];
  const seenInstructions = new Set<string>();
  
  claims.forEach(claim => {
    const text = claim.text || '';
    const source = claim.citations[0] ? getSourcePageById(claim.citations[0].source_page_id) : undefined;
    
    // Try to extract step number from locator heading_path
    const locator = claim.citations[0]?.locator;
    const headingPath = typeof locator === 'object' && locator?.heading_path 
      ? (Array.isArray(locator.heading_path) ? locator.heading_path.join(' › ') : String(locator.heading_path))
      : '';
    
    // Split by numbered patterns or bullet points
    const lines = text.split(/(?:\n|(?:^|\s)(?:\d+[.\):]|[•\-\*])\s*)/g)
      .map(s => s.trim())
      .filter(s => s.length > 10);
    
    if (lines.length > 1) {
      lines.forEach(line => {
        const normalized = line.toLowerCase().slice(0, 50);
        if (!seenInstructions.has(normalized)) {
          seenInstructions.add(normalized);
          steps.push({
            number: steps.length + 1,
            instruction: line,
            sourceUrl: source?.canonical_url,
          });
        }
      });
    } else if (text.length > 10) {
      const normalized = text.toLowerCase().slice(0, 50);
      if (!seenInstructions.has(normalized)) {
        seenInstructions.add(normalized);
        steps.push({
          number: steps.length + 1,
          instruction: text,
          sourceUrl: source?.canonical_url,
        });
      }
    }
  });
  
  return steps;
}

export function StepCards({ claims }: StepCardsProps) {
  const steps = extractStepsFromClaims(claims);
  
  // Get common source URL
  const sourceUrl = steps.find(s => s.sourceUrl)?.sourceUrl;
  
  if (steps.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Application steps information not yet available.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <ol className="space-y-3">
        {steps.map((step) => (
          <li key={step.number} className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center text-sm">
              {step.number}
            </span>
            <p className="text-foreground pt-0.5">{step.instruction}</p>
          </li>
        ))}
      </ol>
      
      {sourceUrl && (
        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          <ExternalLink className="w-3 h-3" />
          Source
        </a>
      )}
    </div>
  );
}
