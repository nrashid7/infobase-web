import { Clock, ExternalLink } from 'lucide-react';
import { NormalizedClaim, getSourcePageById } from '@/lib/kbStore';
import { ApplicationType } from './ApplicationTypeSelector';

interface ProcessingTimeGuideProps {
  claims: NormalizedClaim[];
  applicationType?: ApplicationType;
}

function getProcessingTime(claims: NormalizedClaim[], applicationType?: ApplicationType): { text: string; sourceUrl?: string } | null {
  for (const claim of claims) {
    const text = claim.text || '';
    const source = claim.citations[0] ? getSourcePageById(claim.citations[0].source_page_id) : undefined;
    
    // Filter by application type if provided
    if (applicationType) {
      const textLower = text.toLowerCase();
      if (applicationType === 'super_express' && !textLower.includes('super')) continue;
      if (applicationType === 'express' && !textLower.includes('express')) continue;
    }
    
    // Extract time pattern
    const timeMatch = text.match(/(\d+(?:\s*-\s*\d+)?)\s*(days?|weeks?|hours?|working days?|business days?)/i);
    
    if (timeMatch) {
      return {
        text: timeMatch[0],
        sourceUrl: source?.canonical_url,
      };
    }
    
    // If no pattern, return full text if it's short
    if (text.length < 100) {
      return {
        text,
        sourceUrl: source?.canonical_url,
      };
    }
  }
  
  return null;
}

export function ProcessingTimeGuide({ claims, applicationType }: ProcessingTimeGuideProps) {
  const result = getProcessingTime(claims, applicationType);
  
  if (!result) {
    return (
      <p className="text-muted-foreground text-sm">
        Processing time information not yet available.
      </p>
    );
  }

  return (
    <div className="flex items-center gap-4 p-4 bg-primary/5 border border-primary/20 rounded-lg">
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
        <Clock className="w-5 h-5 text-primary" />
      </div>
      <div className="flex-1">
        <p className="font-medium text-foreground">{result.text}</p>
        {result.sourceUrl && (
          <a
            href={result.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary mt-1 transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            Official source
          </a>
        )}
      </div>
    </div>
  );
}
