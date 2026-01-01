import { useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { BookOpen, Search, ArrowRight, ExternalLink, Building2 } from 'lucide-react';
import { listGuides, listAgencies } from '@/data/guidesStore';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function Guides() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [agencyFilter, setAgencyFilter] = useState(searchParams.get('agency') || 'all');

  const agencies = listAgencies();

  const guides = useMemo(() => {
    return listGuides({
      search: search || undefined,
      agency: agencyFilter !== 'all' ? agencyFilter : undefined,
    });
  }, [search, agencyFilter]);

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
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">Service Guides</h1>
          <p className="text-muted-foreground">
            Step-by-step guides for Bangladesh government services with official citations.
          </p>
        </header>

        {/* Search and Filter */}
        <div className="bg-card border border-border rounded-lg p-4 mb-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  updateFilter('search', e.target.value);
                }}
                placeholder="Search guides (e.g., passport, visa)..."
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
                    {agency.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results count */}
        <p className="text-sm text-muted-foreground mb-4">
          {guides.length} guide{guides.length !== 1 ? 's' : ''} found
        </p>

        {/* Guides Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {guides.map((guide) => (
            <Link
              key={guide.guide_id}
              to={`/guides/${guide.guide_id}`}
              className="bg-card border border-border rounded-lg p-5 hover:shadow-md hover:border-primary/30 transition-all group"
            >
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground uppercase truncate">
                  {guide.agency_name}
                </span>
              </div>

              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors mb-2">
                {guide.title}
              </h3>
              
              <p className="text-sm text-muted-foreground mb-4">
                {guide.step_count > 0 ? `${guide.step_count} steps` : 'Service information'} 
                {guide.citation_count > 0 && ` • ${guide.citation_count} citations`}
              </p>

              <div className="flex items-center justify-between">
                <span className="text-xs text-primary font-medium">View guide</span>
                <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Link>
          ))}
        </div>

        {guides.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-foreground mb-2">No guides found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search or filters.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
