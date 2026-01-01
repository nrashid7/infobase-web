import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Link2, Filter, Search, ArrowRight, Calendar } from 'lucide-react';
import { listSourcePages, getClaimsBySourcePage, getUniqueDomains } from '@/lib/kbStore';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function Sources() {
  const [search, setSearch] = useState('');
  const [domainFilter, setDomainFilter] = useState('all');
  const domains = getUniqueDomains();

  const sources = useMemo(() => {
    return listSourcePages({
      search: search || undefined,
      domain: domainFilter !== 'all' ? domainFilter : undefined,
    });
  }, [search, domainFilter]);

  return (
    <div className="py-8 px-4">
      <div className="container">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">Official Sources</h1>
          <p className="text-muted-foreground">Browse all official government pages we reference.</p>
        </header>

        <div className="bg-card border border-border rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Filters</span>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search sources..." className="pl-10" />
            </div>
            <Select value={domainFilter} onValueChange={setDomainFilter}>
              <SelectTrigger><SelectValue placeholder="All domains" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All domains</SelectItem>
                {domains.map((domain) => (<SelectItem key={domain} value={domain}>{domain}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-4">{sources.length} sources found</p>

        <div className="space-y-3">
          {sources.map((source) => {
            const claims = getClaimsBySourcePage(source.id);
            return (
              <Link key={source.id} to={`/admin/sources/${source.id}`} className="block bg-card border border-border rounded-lg p-4 hover:shadow-md transition-all group">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Link2 className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-primary">{source.domain}</span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate mb-2">{source.canonical_url}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {source.fetched_at && (<span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Last crawled: {new Date(source.fetched_at).toLocaleDateString()}</span>)}
                      <span>{claims.length} facts</span>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>
            );
          })}
        </div>

        {sources.length === 0 && (
          <div className="text-center py-12">
            <Link2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-foreground mb-2">No sources found</h3>
          </div>
        )}
      </div>
    </div>
  );
}
