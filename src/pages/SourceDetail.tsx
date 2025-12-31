import { useParams, Link } from 'react-router-dom';
import { Link2, ArrowLeft, ExternalLink, Calendar, Hash, FileText, AlertTriangle } from 'lucide-react';
import { getSourcePageById, getClaimsBySourcePage } from '@/lib/kbStore';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';

export default function SourceDetail() {
  const { id } = useParams<{ id: string }>();
  const source = id ? getSourcePageById(id) : undefined;
  const claims = id ? getClaimsBySourcePage(id) : [];

  if (!source) {
    return (
      <div className="py-16 text-center">
        <Link2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-foreground mb-2">Source not found</h2>
        <p className="text-muted-foreground mb-4">The requested source page could not be found.</p>
        <Button asChild variant="outline">
          <Link to="/sources">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Sources
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="py-8 px-4">
      <div className="container max-w-4xl">
        {/* Back link */}
        <Link
          to="/sources"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Sources
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link2 className="w-4 h-4" />
            <span>Source Page</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">{source.domain}</h1>
          <a
            href={source.canonical_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline inline-flex items-center gap-2 break-all"
          >
            {source.canonical_url}
            <ExternalLink className="w-4 h-4 flex-shrink-0" />
          </a>
        </div>

        {/* Source Metadata */}
        <div className="bg-card border border-border rounded-lg p-6 mb-8">
          <h2 className="font-semibold text-foreground mb-4">Source Metadata</h2>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground">Fetched At</p>
                <p className="font-medium text-foreground">
                  {new Date(source.fetched_at).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Hash className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground">Content Hash</p>
                <p className="font-mono text-foreground">{source.content_hash}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Snapshot */}
        <div className="bg-card border border-border rounded-lg p-6 mb-8">
          <h2 className="font-semibold text-foreground mb-4">Snapshot</h2>
          <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-foreground">Snapshot Reference</p>
              <p className="text-sm font-mono text-muted-foreground mt-1">{source.snapshot_ref}</p>
              <p className="text-sm text-muted-foreground mt-2">
                Snapshot not bundled in this build. To view the snapshot, include the markdown file at the specified path.
              </p>
            </div>
          </div>
        </div>

        {/* Claims from this source */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="font-semibold text-foreground mb-4">
            Claims from this Source ({claims.length})
          </h2>
          {claims.length > 0 ? (
            <div className="space-y-3">
              {claims.map((claim) => (
                <Link
                  key={claim.id}
                  to={`/claims/${claim.id}`}
                  className="block p-4 rounded-lg border border-border hover:border-primary/30 hover:bg-accent/30 transition-all group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <StatusBadge status={claim.status} />
                      </div>
                      <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                        {claim.summary || claim.id}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {claim.text}
                      </p>
                      {claim.citations.find(c => c.source_page_id === source.id) && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Locator: {claim.citations.find(c => c.source_page_id === source.id)?.locator}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No claims have been extracted from this source yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
