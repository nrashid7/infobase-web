import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, ChevronDown, ChevronUp, Quote } from 'lucide-react';
import { NormalizedClaim, getSourcePageById } from '@/lib/kbStore';
import { StatusBadge } from './StatusBadge';
import { AuditDetailsAccordion } from './AuditDetailsAccordion';
import { cn, formatLocator, safeRender } from '@/lib/utils';
import { generateClaimTitle } from '@/lib/citizenLabels';

interface ClaimCardProps {
  claim: NormalizedClaim;
  showCategory?: boolean;
  className?: string;
}

export function ClaimCard({ claim, showCategory = false, className }: ClaimCardProps) {
  const [expandedCitation, setExpandedCitation] = useState<number | null>(null);

  const title = generateClaimTitle(claim);

  return (
    <div className={cn("claim-card animate-fade-in", className)}>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <StatusBadge status={claim.status} />
        </div>
      </div>

      {/* Human-readable title */}
      <h4 className="font-medium text-foreground mb-2">
        {title}
      </h4>
      
      {/* Main content */}
      <p className="text-muted-foreground text-sm mb-4">{safeRender(claim.text)}</p>

      {/* Source citations - proof-like */}
      <div className="space-y-2 border-t border-border pt-3">
        {claim.citations.map((citation, idx) => {
          const sourcePage = getSourcePageById(citation.source_page_id);
          const isExpanded = expandedCitation === idx;
          const locatorText = formatLocator(citation.locator);
          const quotedText = citation.quoted_text ? safeRender(citation.quoted_text) : null;
          
          return (
            <div key={idx} className="text-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  {sourcePage?.canonical_url ? (
                    <a
                      href={sourcePage.canonical_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-primary hover:underline font-medium"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Open official source
                    </a>
                  ) : (
                    <span className="text-muted-foreground">Official source</span>
                  )}
                </div>
                <button
                  onClick={() => setExpandedCitation(isExpanded ? null : idx)}
                  className="text-muted-foreground hover:text-foreground transition-colors p-1"
                  aria-label={isExpanded ? "Hide details" : "Show details"}
                >
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
              </div>
              
              {/* Expanded details with quoted text */}
              {isExpanded && (
                <div className="mt-2 pl-4 border-l-2 border-muted space-y-2 text-sm">
                  {locatorText && (
                    <p className="text-muted-foreground">
                      <span className="font-medium">Section:</span> {locatorText}
                    </p>
                  )}
                  {quotedText && (
                    <blockquote className="flex items-start gap-2 bg-muted/50 p-3 rounded-md italic text-muted-foreground">
                      <Quote className="w-4 h-4 flex-shrink-0 mt-0.5 text-muted-foreground/60" />
                      <span>"{quotedText}"</span>
                    </blockquote>
                  )}
                  {sourcePage?.fetched_at && (
                    <p className="text-xs text-muted-foreground">
                      Last crawled: {new Date(sourcePage.fetched_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Verification Info - citizen friendly */}
      {claim.status === 'verified' && claim.verified_at && (
        <div className="mt-4 pt-3 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Verified on {new Date(claim.verified_at).toLocaleDateString()} 
          </p>
        </div>
      )}

      {/* Stale Info - citizen friendly */}
      {claim.status === 'stale' && (
        <div className="mt-4 pt-3 border-t border-border">
          <p className="text-xs text-status-stale">
            This information may be outdated. Please verify on the official website.
          </p>
        </div>
      )}

      {/* Deprecated Info - citizen friendly */}
      {claim.status === 'deprecated' && (
        <div className="mt-4 pt-3 border-t border-border">
          <p className="text-xs text-status-deprecated">
            This information is no longer current.
          </p>
        </div>
      )}

      {/* Audit details accordion (hidden by default) */}
      <div className="mt-4 pt-2">
        <AuditDetailsAccordion claim={claim} />
      </div>
    </div>
  );
}
