import { useParams, Link } from 'react-router-dom';
import { FileText, ArrowLeft, ExternalLink, Copy, Check, Database } from 'lucide-react';
import { useState } from 'react';
import { getClaimById, getSourcePageById, getServicesReferencingClaim, CATEGORY_LABELS } from '@/lib/kbStore';
import { StatusBadge } from '@/components/StatusBadge';
import { WarningBanner } from '@/components/WarningBanner';
import { Button } from '@/components/ui/button';
import { formatLocator, safeRender } from '@/lib/utils';

export default function ClaimDetail() {
  const { id } = useParams<{ id: string }>();
  const claim = id ? getClaimById(id) : undefined;
  const [copied, setCopied] = useState(false);

  if (!claim) {
    return (
      <div className="py-16 text-center">
        <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-foreground mb-2">Claim not found</h2>
        <p className="text-muted-foreground mb-4">The requested claim could not be found.</p>
        <Button asChild variant="outline">
          <Link to="/claims">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Claims
          </Link>
        </Button>
      </div>
    );
  }

  const services = getServicesReferencingClaim(claim.id);
  const needsWarning = claim.status !== 'verified';

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
          to="/claims"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Claims
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <FileText className="w-4 h-4" />
            <span>{CATEGORY_LABELS[claim.category] || claim.category}</span>
          </div>
          <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
            <h1 className="text-2xl font-bold text-foreground">
              {safeRender(claim.summary, claim.id)}
            </h1>
            <StatusBadge status={claim.status} size="md" />
          </div>
          <p className="text-lg text-muted-foreground">{safeRender(claim.text)}</p>
        </div>

        {/* Warning */}
        {needsWarning && (
          <WarningBanner
            message="This claim has not been verified. See citations and verify on the official portal."
            className="mb-8"
          />
        )}

        {/* Verification Panel */}
        <div className="bg-card border border-border rounded-lg p-6 mb-8">
          <h2 className="font-semibold text-foreground mb-4">Verification Details</h2>
          
          {claim.status === 'verified' && (
            <div className="space-y-2 text-sm">
              {claim.verified_at && (
                <p><span className="text-muted-foreground">Verified at:</span> {new Date(claim.verified_at).toLocaleString()}</p>
              )}
              {claim.verified_by && (
                <p><span className="text-muted-foreground">Verified by:</span> {claim.verified_by}</p>
              )}
              {claim.verification_notes && (
                <p><span className="text-muted-foreground">Notes:</span> {claim.verification_notes}</p>
              )}
            </div>
          )}

          {claim.status === 'stale' && (
            <div className="space-y-2 text-sm">
              {claim.stale_marked_at && (
                <p><span className="text-muted-foreground">Marked stale at:</span> {new Date(claim.stale_marked_at).toLocaleString()}</p>
              )}
              {claim.stale_due_to_source_hash && (
                <p className="text-status-stale">Source content has changed since verification</p>
              )}
              {claim.previous_status && (
                <p><span className="text-muted-foreground">Previous status:</span> {claim.previous_status}</p>
              )}
            </div>
          )}

          {claim.status === 'deprecated' && claim.deprecated_reason && (
            <div className="text-sm">
              <p className="text-status-deprecated">{claim.deprecated_reason}</p>
            </div>
          )}

          {claim.status === 'unverified' && (
            <p className="text-sm text-muted-foreground">This claim has not yet been verified against its source.</p>
          )}
        </div>

        {/* Citations */}
        <div className="bg-card border border-border rounded-lg p-6 mb-8">
          <h2 className="font-semibold text-foreground mb-4">
            Citations ({claim.citations.length})
          </h2>
          <div className="space-y-4">
            {claim.citations.map((citation, idx) => {
              const sourcePage = getSourcePageById(citation.source_page_id);
              const locatorText = formatLocator(citation.locator);
              return (
                <div key={idx} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                  <FileText className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <Link
                      to={`/sources/${citation.source_page_id}`}
                      className="font-medium text-primary hover:underline inline-flex items-center gap-1"
                    >
                      {sourcePage?.domain || citation.source_page_id}
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                    {locatorText && (
                      <p className="text-sm text-muted-foreground mt-1">{locatorText}</p>
                    )}
                    {citation.quoted_text && (
                      <p className="text-sm text-muted-foreground mt-1 italic">
                        "{safeRender(citation.quoted_text)}"
                      </p>
                    )}
                    {sourcePage?.fetched_at && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Fetched: {new Date(sourcePage.fetched_at).toLocaleDateString()}
                      </p>
                    )}
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
              Referenced by Services ({services.length})
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

        {/* Full JSON */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground">Full Claim JSON</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyJson}
            >
              {copied ? (
                <Check className="w-4 h-4 text-status-verified" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
              <span className="ml-2">{copied ? 'Copied!' : 'Copy'}</span>
            </Button>
          </div>
          <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
            <code>{JSON.stringify(claim, null, 2)}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}
