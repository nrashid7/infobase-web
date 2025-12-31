import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Link2, Filter, Search, ArrowRight, Calendar, Hash } from 'lucide-react';
import { listSourcePages, getClaimsBySourcePage, getUniqueDomains } from '@/lib/kbStore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function Sources() {
  const [search, setSearch] = useState('');
  const [domainFilter, setDomainFilter] = useState('all');
  const [hasStaleClaims, setHasStaleClaims] = useState(false);
  const [hasVerifiedClaims, setHasVerifiedClaims] = useState(false);

  const domains = getUniqueDomains();

  const sources = useMemo(() => {
    return listSourcePages({
      search: search || undefined,
      domain: domainFilter !== 'all' ? domainFilter : undefined,
      hasStaleClaims: hasStaleClaims || undefined,
      hasVerifiedClaims: hasVerifiedClaims || undefined,
    });
  }, [search, domainFilter, hasStaleClaims, hasVerifiedClaims]);

  return (
    <div className="py-8 px-4">
      <div className="container">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Link2 className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Sources Directory</h1>
          </div>
          <p className="text-muted-foreground">
            Browse all source pages used to extract claims. Each source is a snapshot of an official government page.
          </p>
        </div>

        {/* Filters */}
        <div className="bg-card border border-border rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Filters</span>
          </div>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search sources..."
                className="pl-10"
              />
            </div>

            <Select value={domainFilter} onValueChange={setDomainFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All domains" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All domains</SelectItem>
                {domains.map((domain) => (
                  <SelectItem key={domain} value={domain}>
                    {domain}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Button
                variant={hasStaleClaims ? "default" : "outline"}
                onClick={() => setHasStaleClaims(!hasStaleClaims)}
                size="sm"
                className="flex-1"
              >
                Has Stale
              </Button>
              <Button
                variant={hasVerifiedClaims ? "default" : "outline"}
                onClick={() => setHasVerifiedClaims(!hasVerifiedClaims)}
                size="sm"
                className="flex-1"
              >
                Has Verified
              </Button>
            </div>
          </div>
        </div>

        {/* Results count */}
        <p className="text-sm text-muted-foreground mb-4">
          {sources.length} source page{sources.length !== 1 ? 's' : ''} found
        </p>

        {/* Sources List */}
        <div className="space-y-3">
          {sources.map((source) => {
            const claims = getClaimsBySourcePage(source.id);
            const verifiedCount = claims.filter(c => c.status === 'verified').length;
            const staleCount = claims.filter(c => c.status === 'stale').length;

            return (
              <Link
                key={source.id}
                to={`/sources/${source.id}`}
                className="block bg-card border border-border rounded-lg p-4 hover:shadow-md hover:border-primary/30 transition-all group animate-fade-in"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Link2 className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-primary">{source.domain}</span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate mb-3">
                      {source.canonical_url}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(source.fetched_at).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Hash className="w-3 h-3" />
                        {source.content_hash.substring(0, 8)}...
                      </span>
                      <span>{claims.length} claims</span>
                      {verifiedCount > 0 && (
                        <span className="text-status-verified">{verifiedCount} verified</span>
                      )}
                      {staleCount > 0 && (
                        <span className="text-status-stale">{staleCount} stale</span>
                      )}
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                </div>
              </Link>
            );
          })}
        </div>

        {sources.length === 0 && (
          <div className="text-center py-12">
            <Link2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-foreground mb-2">No sources found</h3>
            <p className="text-muted-foreground">
              Try adjusting your filters or search query.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
