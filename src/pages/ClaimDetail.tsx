import { useParams, Link } from 'react-router-dom';
import { FileText, ArrowLeft, ExternalLink, Database, ChevronDown, ChevronUp, Quote, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { getClaimById, getSourcePageById, getServicesReferencingClaim, CATEGORY_LABELS } from '@/lib/kbStore';
import { StatusBadge } from '@/components/StatusBadge';
import { WarningBanner } from '@/components/WarningBanner';
import { Button } from '@/components/ui/button';
import { formatLocator, safeRender } from '@/lib/utils';
import { generateClaimTitle } from '@/lib/citizenLabels';

export default function ClaimDetail() {
  const { id } = useParams<{ id: string }>();
  const claim = id ? getClaimById(id) : undefined;
  const [copied, setCopied] = useState(false);
  const [showAudit, setShowAudit] = useState(false);

  if (!claim) {
    return (
      <div className="py-16 text-center">
        <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-foreground mb-2">Information not found</h2>
        <p className="text-muted-foreground mb-4">The requested information could not be found.</p>
        <Button asChild variant="outline">
          <Link to="/admin/claims">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Facts & Citations
          </Link>
        </Button>
      </div>
    );
  }

  const services = getServicesReferencingClaim(claim.id);
  const needsWarning = claim.status !== 'verified';
  const humanTitle = generateClaimTitle(claim);

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(claim, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="py-8 px-4">
      <div className="container max-w-4xl">
        {/* Back link */}
        <Link
          to="/admin/claims"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Facts & Citations
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <FileText className="w-4 h-4" />
            <span>{CATEGORY_LABELS[claim.category] || claim.category}</span>
          </div>
          <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
            <h1 className="text-2xl font-bold text-foreground">
              {humanTitle}
            </h1>
            <StatusBadge status={claim.status} size="md" />
          </div>
          <p className="text-lg text-muted-foreground">{safeRender(claim.text)}</p>
        </div>

        {/* Warning */}
        {needsWarning && (
          <WarningBanner
            message="This information has not been verified. See citations below and verify on the official portal."
            className="mb-8"
          />
        )}

        {/* Verification Panel */}
        <div className="bg-card border border-border rounded-lg p-6 mb-8">
          <h2 className="font-semibold text-foreground mb-4">Verification status</h2>
          
          {claim.status === 'verified' && (
            <div className="space-y-2 text-sm">
              {claim.verified_at && (
                <p><span className="text-muted-foreground">Verified:</span> {new Date(claim.verified_at).toLocaleString()}</p>
              )}
              {claim.verification_notes && (
                <p><span className="text-muted-foreground">Notes:</span> {claim.verification_notes}</p>
              )}
            </div>
          )}

          {claim.status === 'stale' && (
            <div className="space-y-2 text-sm">
              {claim.stale_marked_at && (
                <p><span className="text-muted-foreground">Flagged as potentially outdated:</span> {new Date(claim.stale_marked_at).toLocaleString()}</p>
              )}
              {claim.stale_due_to_source_hash && (
                <p className="text-status-stale">The official source page has been updated since this was last verified.</p>
              )}
            </div>
          )}

          {claim.status === 'deprecated' && claim.deprecated_reason && (
            <div className="text-sm">
              <p className="text-status-deprecated">{claim.deprecated_reason}</p>
            </div>
          )}

          {claim.status === 'unverified' && (
            <p className="text-sm text-muted-foreground">This information has not yet been independently verified.</p>
          )}
        </div>

        {/* Citations - Proof-like display */}
        <div className="bg-card border border-border rounded-lg p-6 mb-8">
          <h2 className="font-semibold text-foreground mb-4">
            Official sources ({claim.citations.length})
          </h2>
          <div className="space-y-4">
            {claim.citations.map((citation, idx) => {
              const sourcePage = getSourcePageById(citation.source_page_id);
              const locatorText = formatLocator(citation.locator);
              const quotedText = citation.quoted_text ? safeRender(citation.quoted_text) : null;
              
              return (
                <div key={idx} className="p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-start gap-3">
                    <ExternalLink className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      {sourcePage?.canonical_url ? (
                        <a
                          href={sourcePage.canonical_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-primary hover:underline"
                        >
                          Open official source →
                        </a>
                      ) : (
                        <span className="font-medium text-foreground">Official source</span>
                      )}
                      
                      {locatorText && (
                        <p className="text-sm text-muted-foreground mt-2">
                          <span className="font-medium">Section:</span> {locatorText}
                        </p>
                      )}
                      
                      {quotedText && (
                        <blockquote className="flex items-start gap-2 mt-3 bg-background p-3 rounded-md border-l-2 border-primary/30">
                          <Quote className="w-4 h-4 flex-shrink-0 mt-0.5 text-muted-foreground/60" />
                          <span className="text-sm italic text-muted-foreground">"{quotedText}"</span>
                        </blockquote>
                      )}
                      
                      {sourcePage?.fetched_at && (
                        <p className="text-xs text-muted-foreground mt-3">
                          Last crawled: {new Date(sourcePage.fetched_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Services referencing this claim */}
        {services.length > 0 && (
          <div className="bg-card border border-border rounded-lg p-6 mb-8">
            <h2 className="font-semibold text-foreground mb-4">
              Related services ({services.length})
            </h2>
            <div className="space-y-2">
              {services.map((service) => (
                <Link
                  key={service.id}
                  to={`/services/${service.id}`}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <Database className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium text-foreground hover:text-primary">
                    {service.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Audit Section (hidden by default) */}
        <div className="border-t border-border pt-6">
          <button
            onClick={() => setShowAudit(!showAudit)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showAudit ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
            <span className="text-sm font-medium">Audit details</span>
          </button>

          {showAudit && (
            <div className="mt-4 bg-muted/30 border border-border rounded-lg p-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Claim ID</p>
                  <code className="text-xs bg-muted px-2 py-1 rounded font-mono">{claim.id}</code>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Source Page IDs</p>
                  <div className="space-y-1">
                    {claim.citations.map((cit, idx) => (
                      <code key={idx} className="block text-xs bg-muted px-2 py-1 rounded font-mono">
                        {cit.source_page_id}
                      </code>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-muted-foreground">Full audit record (JSON)</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyJson}
                      className="h-7 text-xs"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3 h-3 mr-1" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 mr-1" />
                          Copy audit record
                        </>
                      )}
                    </Button>
                  </div>
                  <pre className="bg-muted rounded-lg p-4 overflow-x-auto text-xs font-mono whitespace-pre-wrap max-h-64">
                    {JSON.stringify(claim, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
