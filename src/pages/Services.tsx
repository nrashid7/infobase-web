import { useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Database, Filter, Search, ArrowRight, ExternalLink } from 'lucide-react';
import { listServices, listAgencies, getUniqueDomains, getAgencyById, ClaimStatus } from '@/lib/kbStore';
import { StatusBadge } from '@/components/StatusBadge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function Services() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [agencyFilter, setAgencyFilter] = useState(searchParams.get('agency') || 'all');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
  const [onlyVerified, setOnlyVerified] = useState(false);

  const agencies = listAgencies();
  const domains = getUniqueDomains();

  const services = useMemo(() => {
    return listServices({
      search: search || undefined,
      agency_id: agencyFilter !== 'all' ? agencyFilter : undefined,
      status: statusFilter !== 'all' ? (statusFilter as ClaimStatus | 'partial') : undefined,
      onlyVerified,
    });
  }, [search, agencyFilter, statusFilter, onlyVerified]);

  const updateFilter = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value === 'all' || value === '') {
      newParams.delete(key);
    } else {
      newParams.set(key, value);
    }
    setSearchParams(newParams);
  };

  return (
    <div className="py-8 px-4">
      <div className="container">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Database className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Services Directory</h1>
          </div>
          <p className="text-muted-foreground">
            Browse all government services with their verification status and claim details.
          </p>
        </div>

        {/* Filters */}
        <div className="bg-card border border-border rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Filters</span>
          </div>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  updateFilter('search', e.target.value);
                }}
                placeholder="Search services..."
                className="pl-10"
              />
            </div>

            <Select value={agencyFilter} onValueChange={(v) => {
              setAgencyFilter(v);
              updateFilter('agency', v);
            }}>
              <SelectTrigger>
                <SelectValue placeholder="All agencies" />
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

            <Select value={statusFilter} onValueChange={(v) => {
              setStatusFilter(v);
              updateFilter('status', v);
            }}>
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="unverified">Unverified</SelectItem>
                <SelectItem value="stale">Stale</SelectItem>
                <SelectItem value="deprecated">Deprecated</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant={onlyVerified ? "default" : "outline"}
              onClick={() => setOnlyVerified(!onlyVerified)}
              className="w-full"
            >
              Only Verified Claims
            </Button>
          </div>
        </div>

        {/* Results count */}
        <p className="text-sm text-muted-foreground mb-4">
          {services.length} service{services.length !== 1 ? 's' : ''} found
        </p>

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((service) => {
            const agency = getAgencyById(service.agency_id);
            return (
              <Link
                key={service.id}
                to={`/services/${service.id}`}
                className="bg-card border border-border rounded-lg p-5 hover:shadow-md hover:border-primary/30 transition-all group animate-fade-in"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground uppercase">
                      {agency?.short_name}
                    </span>
                  </div>
                  <StatusBadge status={service.status || 'unverified'} />
                </div>

                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors mb-2">
                  {service.name}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                  {service.description}
                </p>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {service.claim_ids.length} claim{service.claim_ids.length !== 1 ? 's' : ''}
                  </span>
                  <div className="flex items-center gap-2">
                    {service.portal_url && (
                      <ExternalLink className="w-4 h-4 text-muted-foreground" />
                    )}
                    <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {services.length === 0 && (
          <div className="text-center py-12">
            <Database className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-foreground mb-2">No services found</h3>
            <p className="text-muted-foreground">
              Try adjusting your filters or search query.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
