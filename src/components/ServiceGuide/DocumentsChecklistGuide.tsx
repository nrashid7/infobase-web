import { Check, ExternalLink } from 'lucide-react';
import { NormalizedClaim, getSourcePageById } from '@/lib/kbStore';

interface DocumentsChecklistGuideProps {
  claims: NormalizedClaim[];
}

interface DocumentItem {
  name: string;
  sourceUrl?: string;
}

function extractDocuments(claims: NormalizedClaim[]): DocumentItem[] {
  const documents: DocumentItem[] = [];
  const seen = new Set<string>();
  
  claims.forEach(claim => {
    const text = claim.text || '';
    const source = claim.citations[0] ? getSourcePageById(claim.citations[0].source_page_id) : undefined;
    
    // Split by bullets, newlines, or numbered items
    const items = text.split(/(?:^|\n)\s*(?:[•\-\*\d]+[.\):]?\s*)/g)
      .map(s => s.trim())
      .filter(s => s.length > 3 && s.length < 200);
    
    if (items.length > 1) {
      items.forEach(item => {
        const normalized = item.toLowerCase();
        if (!seen.has(normalized)) {
          seen.add(normalized);
          documents.push({
            name: item,
            sourceUrl: source?.canonical_url,
          });
        }
      });
    } else if (text.length > 3) {
      // Single item
      const normalized = text.toLowerCase();
      if (!seen.has(normalized)) {
        seen.add(normalized);
        documents.push({
          name: text,
          sourceUrl: source?.canonical_url,
        });
      }
    }
  });
  
  return documents;
}

export function DocumentsChecklistGuide({ claims }: DocumentsChecklistGuideProps) {
  const documents = extractDocuments(claims);
  
  if (documents.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Required documents information not yet available.
      </p>
    );
  }

  // Get unique source for footer
  const sourceUrl = documents.find(d => d.sourceUrl)?.sourceUrl;

  return (
    <div className="space-y-3">
      <ul className="space-y-2">
        {documents.map((doc, idx) => (
          <li key={idx} className="flex items-start gap-3 p-3 bg-card border border-border rounded-lg">
            <div className="flex-shrink-0 w-5 h-5 rounded border-2 border-primary/30 flex items-center justify-center mt-0.5">
              <Check className="w-3 h-3 text-primary opacity-0" />
            </div>
            <span className="text-foreground text-sm">{doc.name}</span>
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
          Official source
        </a>
      )}
    </div>
  );
}
