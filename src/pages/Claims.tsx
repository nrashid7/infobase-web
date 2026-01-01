import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Filter, Search, ArrowRight } from 'lucide-react';
import { listClaims, listAgencies, getUniqueDomains, ClaimStatus, NormalizedCategory, CATEGORY_ORDER, CATEGORY_LABELS } from '@/lib/kbStore';
import { StatusBadge } from '@/components/StatusBadge';
import { WarningBanner } from '@/components/WarningBanner';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type SortOption = 'status' | 'newest' | 'alphabetical';

export default function Claims() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [agencyFilter, setAgencyFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [domainFilter, setDomainFilter] = useState('all');
  const [sortBy, setSortBy] = useState<SortOption>('status');

  const agencies = listAgencies();
  const domains = getUniqueDomains();
  const categories = CATEGORY_ORDER;

  const claims = useMemo(() => {
    let filtered = listClaims({
      search: search || undefined,
      status: statusFilter !== 'all' ? (statusFilter as ClaimStatus) : undefined,
      agency_id: agencyFilter !== 'all' ? agencyFilter : undefined,
      category: categoryFilter !== 'all' ? (categoryFilter as NormalizedCategory) : undefined,
      domain: domainFilter !== 'all' ? domainFilter : undefined,
    });

    // Sort
    const statusOrder: Record<ClaimStatus, number> = {
      contradicted: 0,
      deprecated: 1,
      stale: 2,
      unverified: 3,
      verified: 4,
    };

    if (sortBy === 'status') {
      filtered.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);
    } else if (sortBy === 'newest') {
      filtered.sort((a, b) => {
        const dateA = a.verified_at || a.stale_marked_at || '';
        const dateB = b.verified_at || b.stale_marked_at || '';
        return dateB.localeCompare(dateA);
      });
    } else if (sortBy === 'alphabetical') {
      filtered.sort((a, b) => (a.summary || a.id).localeCompare(b.summary || b.id));
    }

    return filtered;
  }, [search, statusFilter, agencyFilter, categoryFilter, domainFilter, sortBy]);

  const hasNoVerified = claims.length > 0 && !claims.some(c => c.status === 'verified');

  return (
    <div className="py-8 px-4">
      <div className="container">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Browse all facts</h1>
          </div>
          <p className="text-muted-foreground">
            Search all information across government services with verification status and official sources.
          </p>
        </div>

        {/* Filters */}
        <div className="bg-card border border-border rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Filters & Sorting</span>
          </div>
          <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search claims..."
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="unverified">Unverified</SelectItem>
                <SelectItem value="stale">Stale</SelectItem>
                <SelectItem value="deprecated">Deprecated</SelectItem>
                <SelectItem value="contradicted">Contradicted</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {CATEGORY_LABELS[cat]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={agencyFilter} onValueChange={setAgencyFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Agency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All agencies</SelectItem>
                {agencies.map((agency) => (
                  <SelectItem key={agency.id} value={agency.id}>
                    {agency.short_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="status">Status Severity</SelectItem>
                <SelectItem value="newest">Newest Verified</SelectItem>
                <SelectItem value="alphabetical">Alphabetical</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* No verified warning */}
        {hasNoVerified && (
          <WarningBanner
            title="No verified information available yet"
            message="This information comes directly from official sources. Always verify on the official portal before taking action."
            className="mb-6"
          />
        )}

        {/* Results count */}
        <p className="text-sm text-muted-foreground mb-4">
          {claims.length} result{claims.length !== 1 ? 's' : ''} found
        </p>

        {/* Claims List */}
        <div className="space-y-3">
          {claims.map((claim) => (
            <Link
              key={claim.id}
              to={`/claims/${claim.id}`}
              className="block bg-card border border-border rounded-lg p-4 hover:shadow-md hover:border-primary/30 transition-all group animate-fade-in"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-xs font-medium text-muted-foreground uppercase">
                      {CATEGORY_LABELS[claim.category] || claim.category}
                    </span>
                    <StatusBadge status={claim.status} />
                  </div>
                  <h3 className="font-medium text-foreground group-hover:text-primary transition-colors mb-1">
                    {claim.summary || claim.id}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">{claim.text}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {claim.citations.length} citation{claim.citations.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
              </div>
            </Link>
          ))}
        </div>

        {claims.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-foreground mb-2">No claims found</h3>
            <p className="text-muted-foreground">
              Try adjusting your filters or search query.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
