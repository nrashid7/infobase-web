import { Check } from 'lucide-react';
import { NormalizedClaim } from '@/lib/kbStore';
import { ClaimCard } from '../ClaimCard';

interface DocumentsChecklistProps {
  claims: NormalizedClaim[];
}

function extractDocuments(claim: NormalizedClaim): string[] {
  const text = claim.text || '';
  
  // Try splitting by common patterns
  const patterns = [
    /(?:^|\n)\s*[•\-\*✓✔☐☑]\s*/,  // Bullet points
    /(?:^|\n)\s*\d+[.\)]\s*/,      // Numbered
    /,\s*(?=\w)/,                  // Comma-separated
    /\n+/                          // Line breaks
  ];
  
  for (const pattern of patterns) {
    if (pattern.test(text)) {
      const docs = text.split(pattern)
        .map(s => s.trim())
        .filter(s => s.length > 3 && s.length < 200);
      if (docs.length > 1) return docs;
    }
  }
  
  return [];
}

export function DocumentsChecklist({ claims }: DocumentsChecklistProps) {
  // Extract all documents
  const allDocs: { doc: string; claimId: string }[] = [];
  
  claims.forEach(claim => {
    const docs = extractDocuments(claim);
    if (docs.length > 0) {
      docs.forEach(doc => {
        allDocs.push({ doc, claimId: claim.id });
      });
    }
  });

  // If we have structured documents, show as checklist
  if (allDocs.length > 0) {
    return (
      <div className="space-y-4">
        <ul className="space-y-2">
          {allDocs.map((item, idx) => (
            <li key={idx} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/30">
              <div className="flex-shrink-0 w-5 h-5 rounded border border-border flex items-center justify-center mt-0.5">
                <Check className="w-3 h-3 text-muted-foreground/50" />
              </div>
              <span className="text-foreground">{item.doc}</span>
            </li>
          ))}
        </ul>
        
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
