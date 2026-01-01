import { ExternalLink } from 'lucide-react';
import { NormalizedClaim, getSourcePageById } from '@/lib/kbStore';
import { ApplicationType } from './ApplicationTypeSelector';

interface FeesTableGuideProps {
  claims: NormalizedClaim[];
  applicationType?: ApplicationType;
}

interface FeeRow {
  type: string;
  pages: string;
  deliveryTime: string;
  amount: string;
  sourceUrl?: string;
}

function extractFeeRows(claims: NormalizedClaim[], applicationType?: ApplicationType): FeeRow[] {
  const rows: FeeRow[] = [];
  
  claims.forEach(claim => {
    const text = claim.text || '';
    const source = claim.citations[0] ? getSourcePageById(claim.citations[0].source_page_id) : undefined;
    
    // Filter by application type if provided
    if (applicationType) {
      const textLower = text.toLowerCase();
      if (applicationType === 'super_express' && !textLower.includes('super')) return;
      if (applicationType === 'express' && !textLower.includes('express')) return;
      if (applicationType === 'regular' && (textLower.includes('express') || textLower.includes('super'))) return;
    }
    
    // Extract amount
    const amountMatch = text.match(/(?:BDT|Tk\.?|৳)\s*[\d,]+(?:\.\d+)?/i) ||
                        text.match(/[\d,]+(?:\.\d+)?\s*(?:BDT|Tk\.?|taka)/i);
    
    // Extract pages
    const pagesMatch = text.match(/(\d+)\s*pages?/i);
    
    // Extract type
    let type = 'Standard';
    if (text.toLowerCase().includes('super express')) type = 'Super Express';
    else if (text.toLowerCase().includes('express')) type = 'Express';
    else if (text.toLowerCase().includes('regular')) type = 'Regular';
    else if (text.toLowerCase().includes('urgent')) type = 'Urgent';
    
    // Extract delivery time
    const deliveryMatch = text.match(/(\d+)\s*(?:days?|weeks?|hours?|working days?)/i);
    
    if (amountMatch) {
      rows.push({
        type,
        pages: pagesMatch ? `${pagesMatch[1]} pages` : '-',
        deliveryTime: deliveryMatch ? deliveryMatch[0] : '-',
        amount: amountMatch[0].trim(),
        sourceUrl: source?.canonical_url,
      });
    }
  });
  
  return rows;
}

export function FeesTableGuide({ claims, applicationType }: FeesTableGuideProps) {
  const rows = extractFeeRows(claims, applicationType);
  
  if (rows.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Fee information not yet available for this service.
      </p>
    );
  }

  // Get unique source for footer
  const sourceUrl = rows.find(r => r.sourceUrl)?.sourceUrl;

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left py-3 px-4 font-medium text-foreground">Type</th>
              <th className="text-left py-3 px-4 font-medium text-foreground">Pages</th>
              <th className="text-left py-3 px-4 font-medium text-foreground">Delivery</th>
              <th className="text-right py-3 px-4 font-medium text-foreground">Amount (BDT)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx} className="border-b border-border/50">
                <td className="py-3 px-4 text-foreground">{row.type}</td>
                <td className="py-3 px-4 text-muted-foreground">{row.pages}</td>
                <td className="py-3 px-4 text-muted-foreground">{row.deliveryTime}</td>
                <td className="py-3 px-4 text-right font-medium text-foreground">{row.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
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
