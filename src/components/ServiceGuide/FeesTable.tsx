import { NormalizedClaim } from '@/lib/kbStore';
import { ClaimCard } from '../ClaimCard';
import { safeRender } from '@/lib/utils';

interface FeesTableProps {
  claims: NormalizedClaim[];
}

interface FeeRow {
  description: string;
  amount: string;
  claim: NormalizedClaim;
}

function extractFeeData(claim: NormalizedClaim): FeeRow | null {
  const text = claim.text || '';
  
  // Try to extract amount patterns like "BDT 1,000" or "৳500" or "$50"
  const amountMatch = text.match(/(?:BDT|Tk\.?|৳|\$|USD)\s*[\d,]+(?:\.\d+)?/i) ||
                      text.match(/[\d,]+(?:\.\d+)?\s*(?:BDT|Tk\.?|taka)/i);
  
  if (amountMatch) {
    const amount = amountMatch[0].trim();
    const description = text.replace(amountMatch[0], '').trim() || claim.summary || 'Service fee';
    return { description, amount, claim };
  }
  
  return null;
}

export function FeesTable({ claims }: FeesTableProps) {
  // Try to extract structured fee data
  const feeRows: FeeRow[] = [];
  const unstructuredClaims: NormalizedClaim[] = [];
  
  claims.forEach(claim => {
    const feeData = extractFeeData(claim);
    if (feeData) {
      feeRows.push(feeData);
    } else {
      unstructuredClaims.push(claim);
    }
  });

  // If we extracted structured data, show as table
  if (feeRows.length > 0) {
    return (
      <div className="space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-3 font-medium text-foreground">Description</th>
                <th className="text-right py-2 px-3 font-medium text-foreground">Amount</th>
              </tr>
            </thead>
            <tbody>
              {feeRows.map((row, idx) => (
                <tr key={idx} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="py-3 px-3 text-muted-foreground">{row.description}</td>
                  <td className="py-3 px-3 text-right font-medium text-foreground">{row.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Show full claim cards for source citations */}
        <div className="space-y-3 mt-4">
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
