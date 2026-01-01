import { useParams, Link } from 'react-router-dom';
import { Link2, ArrowLeft, ExternalLink, Calendar, FileText, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { getSourcePageById, getClaimsBySourcePage } from '@/lib/kbStore';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { safeRender } from '@/lib/utils';
import { generateClaimTitle } from '@/lib/citizenLabels';

export default function SourceDetail() {
  const { id } = useParams<{ id: string }>();
  const source = id ? getSourcePageById(id) : undefined;
  const claims = id ? getClaimsBySourcePage(id) : [];
  const [showAudit, setShowAudit] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!source) {
    return (
      <div className="py-16 text-center">
        <Link2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-foreground mb-2">Source not found</h2>
        <p className="text-muted-foreground mb-4">The requested source page could not be found.</p>
        <Button asChild variant="outline">
          <Link to="/sources">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Official Sources
          </Link>
        </Button>
      </div>
    );
  }

  const handleCopyAudit = () => {
    const auditData = {
      source_page_id: source.id,
      domain: source.domain,
      canonical_url: source.canonical_url,
      fetched_at: source.fetched_at,
      content_hash: source.content_hash,
      snapshot_ref: source.snapshot_ref,
      claims_count: claims.length
    };
    navigator.clipboard.writeText(JSON.stringify(auditData, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const verifiedCount = claims.filter(c => c.status === 'verified').length;
  const unverifiedCount = claims.filter(c => c.status === 'unverified').length;

  return (
    <div className="py-8 px-4">
      <div className="container max-w-4xl">
        {/* Back link */}
        <Link
          to="/sources"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Official Sources
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link2 className="w-4 h-4" />
            <span>Official Source Page</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">{source.domain}</h1>
          <a
            href={source.canonical_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-primary hover:underline"
          >
            <ExternalLink className="w-4 h-4" />
            Open official page →
          </a>
        </div>

        {/* Source Info */}
        <div className="bg-card border border-border rounded-lg p-6 mb-8">
          <h2 className="font-semibold text-foreground mb-4">Source Information</h2>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground">Last crawled</p>
                <p className="font-medium text-foreground">
                  {source.fetched_at 
                    ? new Date(source.fetched_at).toLocaleString() 
                    : 'Unknown'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground">Facts from this source</p>
                <p className="font-medium text-foreground">
                  {claims.length} total ({verifiedCount} verified, {unverifiedCount} pending)
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Facts from this source */}
        <div className="bg-card border border-border rounded-lg p-6 mb-8">
          <h2 className="font-semibold text-foreground mb-4">
            Facts from this source ({claims.length})
          </h2>
          {claims.length > 0 ? (
            <div className="space-y-3">
              {claims.map((claim) => {
                const humanTitle = generateClaimTitle(claim);
                return (
                  <Link
                    key={claim.id}
                    to={`/claims/${claim.id}`}
                    className="block p-4 rounded-lg border border-border hover:border-primary/30 hover:bg-accent/30 transition-all group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <StatusBadge status={claim.status} />
                        </div>
                        <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                          {humanTitle}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {safeRender(claim.text)}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No facts have been extracted from this source yet.
            </p>
          )}
        </div>

        {/* Audit Section */}
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
                  <p className="text-sm font-medium text-muted-foreground mb-1">Source Page ID</p>
                  <code className="text-xs bg-muted px-2 py-1 rounded font-mono">{source.id}</code>
                </div>
                
                {source.content_hash && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Content Hash</p>
                    <code className="text-xs bg-muted px-2 py-1 rounded font-mono block truncate">
                      {source.content_hash}
                    </code>
                  </div>
                )}
                
                {source.snapshot_ref && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Snapshot Reference</p>
                    <code className="text-xs bg-muted px-2 py-1 rounded font-mono block truncate">
                      {source.snapshot_ref}
                    </code>
                  </div>
                )}

                <div className="pt-4 border-t border-border">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyAudit}
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
                        Copy audit record (JSON)
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
