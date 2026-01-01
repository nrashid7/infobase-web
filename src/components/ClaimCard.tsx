import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Copy, Check, ExternalLink, FileText } from 'lucide-react';
import { NormalizedClaim, getSourcePageById } from '@/lib/kbStore';
import { StatusBadge } from './StatusBadge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ClaimCardProps {
  claim: NormalizedClaim;
  showCategory?: boolean;
  className?: string;
}

const categoryLabels: Record<string, string> = {
  eligibility: 'Eligibility',
  fees: 'Fees',
  required_documents: 'Required Documents',
  processing_time: 'Processing Time',
  application_steps: 'Application Steps',
  portal_links: 'Portal Links',
};

export function ClaimCard({ claim, showCategory = false, className }: ClaimCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(claim, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn("claim-card animate-fade-in", className)}>
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          {showCategory && (
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {categoryLabels[claim.category] || claim.category}
            </span>
          )}
          <StatusBadge status={claim.status} />
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopyJson}
          className="h-8 px-2 text-muted-foreground hover:text-foreground"
        >
          {copied ? (
            <Check className="w-4 h-4 text-status-verified" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
          <span className="ml-1 text-xs">Copy JSON</span>
        </Button>
      </div>

      <h4 className="font-medium text-foreground mb-2">
        {claim.summary || claim.id}
      </h4>
      <p className="text-muted-foreground text-sm mb-4">{claim.text}</p>

      {/* Citations */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Citations ({claim.citations.length})
        </p>
        {claim.citations.map((citation, idx) => {
          const sourcePage = getSourcePageById(citation.source_page_id);
          return (
            <div key={idx} className="flex items-start gap-2 text-sm">
              <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div>
                <Link
                  to={`/sources/${citation.source_page_id}`}
                  className="citation-link font-medium"
                >
                  {sourcePage?.domain || citation.source_page_id}
                  <ExternalLink className="w-3 h-3" />
                </Link>
                <p className="text-xs text-muted-foreground mt-0.5">{citation.locator}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Verification Info */}
      {claim.status === 'verified' && claim.verified_at && (
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Verified on {new Date(claim.verified_at).toLocaleDateString()} 
            {claim.verified_by && ` by ${claim.verified_by}`}
          </p>
          {claim.verification_notes && (
            <p className="text-xs text-muted-foreground mt-1">{claim.verification_notes}</p>
          )}
        </div>
      )}

      {/* Stale Info */}
      {claim.status === 'stale' && (
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs text-status-stale">
            Marked stale on {claim.stale_marked_at && new Date(claim.stale_marked_at).toLocaleDateString()}
            {claim.stale_due_to_source_hash && ' (source content changed)'}
          </p>
          {claim.previous_status && (
            <p className="text-xs text-muted-foreground mt-1">
              Previous status: {claim.previous_status}
            </p>
          )}
        </div>
      )}

      {/* Deprecated Info */}
      {claim.status === 'deprecated' && claim.deprecated_reason && (
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs text-status-deprecated">{claim.deprecated_reason}</p>
        </div>
      )}
    </div>
  );
}
