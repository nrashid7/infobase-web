import { ExternalLink } from 'lucide-react';
import { NormalizedClaim, getSourcePageById } from '@/lib/kbStore';
import { cn } from '@/lib/utils';

interface StepCardsProps {
  claims: NormalizedClaim[];
}

interface Step {
  number: number;
  title: string;
  description: string;
  sourceUrl?: string;
}

function extractStepsFromClaims(claims: NormalizedClaim[]): Step[] {
  const steps: Step[] = [];
  let stepNumber = 1;
  
  claims.forEach(claim => {
    const text = claim.text || '';
    const source = claim.citations[0] ? getSourcePageById(claim.citations[0].source_page_id) : undefined;
    
    // Try to split by numbered patterns
    const numberedPattern = /(?:^|\n)\s*(?:(\d+)[.\):]|\bstep\s+(\d+)[.:\)]?)\s*/gi;
    const parts = text.split(numberedPattern).filter(Boolean);
    
    if (parts.length > 2) {
      // Has structured steps
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i].trim();
        if (!part || /^\d+$/.test(part)) continue;
        
        const sentences = part.split(/[.!?]+/).filter(s => s.trim());
        const title = sentences[0]?.trim() || part.slice(0, 50);
        const description = sentences.slice(1).join('. ').trim() || '';
        
        steps.push({
          number: stepNumber++,
          title: title.length > 60 ? title.slice(0, 57) + '...' : title,
          description,
          sourceUrl: source?.canonical_url,
        });
      }
    } else {
      // Single block - try bullet points
      const bulletPattern = /(?:^|\n)\s*[•\-\*]\s*/;
      const bullets = text.split(bulletPattern).filter(s => s.trim());
      
      if (bullets.length > 1) {
        bullets.forEach(bullet => {
          const trimmed = bullet.trim();
          if (!trimmed) return;
          
          steps.push({
            number: stepNumber++,
            title: trimmed.length > 60 ? trimmed.slice(0, 57) + '...' : trimmed,
            description: '',
            sourceUrl: source?.canonical_url,
          });
        });
      } else {
        // Single claim as one step
        const sentences = text.split(/[.!?]+/).filter(s => s.trim());
        steps.push({
          number: stepNumber++,
          title: sentences[0]?.trim() || text.slice(0, 60),
          description: sentences.slice(1).join('. ').trim(),
          sourceUrl: source?.canonical_url,
        });
      }
    }
  });
  
  return steps;
}

export function StepCards({ claims }: StepCardsProps) {
  const steps = extractStepsFromClaims(claims);
  
  if (steps.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Application steps information not yet available.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {steps.map((step) => (
        <div
          key={step.number}
          className="flex gap-4 p-4 bg-card border border-border rounded-lg"
        >
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground font-semibold flex items-center justify-center text-sm">
            {step.number}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-foreground">{step.title}</h4>
            {step.description && (
              <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
            )}
            {step.sourceUrl && (
              <a
                href={step.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary mt-2 transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                Source
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
