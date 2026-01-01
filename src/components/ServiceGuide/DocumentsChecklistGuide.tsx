import { Circle, ExternalLink } from 'lucide-react';
import { NormalizedClaim, getSourcePageById } from '@/lib/kbStore';

interface DocumentsChecklistGuideProps {
  claims: NormalizedClaim[];
}

function extractDocuments(claims: NormalizedClaim[]): string[] {
  const documents: string[] = [];
  const seen = new Set<string>();
  
  claims.forEach(claim => {
    const text = claim.text || '';
    
    // Split by bullets, newlines, or numbered items
    const items = text.split(/(?:^|\n)\s*(?:[•\-\*\d]+[.\):]?\s*)/g)
      .map(s => s.trim())
      .filter(s => s.length > 3 && s.length < 200);
    
    if (items.length > 1) {
      items.forEach(item => {
        const normalized = item.toLowerCase();
        if (!seen.has(normalized)) {
          seen.add(normalized);
          documents.push(item);
        }
      });
    } else if (text.length > 3) {
      const normalized = text.toLowerCase();
      if (!seen.has(normalized)) {
        seen.add(normalized);
        documents.push(text);
      }
    }
  });
  
  return documents;
}

export function DocumentsChecklistGuide({ claims }: DocumentsChecklistGuideProps) {
  const documents = extractDocuments(claims);
  
  // Get source URL from first claim
  const sourceUrl = claims[0]?.citations[0] 
    ? getSourcePageById(claims[0].citations[0].source_page_id)?.canonical_url 
    : undefined;
  
  if (documents.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Required documents information not yet available.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <ul className="space-y-2">
        {documents.map((doc, idx) => (
          <li key={idx} className="flex items-start gap-3">
            <Circle className="w-2 h-2 mt-2 text-primary fill-primary flex-shrink-0" />
            <span className="text-foreground">{doc}</span>
          </li>
        ))}
      </ul>
      
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
