import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Filter, Search, ArrowRight } from 'lucide-react';
import { listClaims, ClaimStatus, NormalizedCategory, CATEGORY_ORDER, CATEGORY_LABELS } from '@/lib/kbStore';
import { StatusBadge } from '@/components/StatusBadge';
import { Input } from '@/components/ui/input';
import { generateClaimTitle } from '@/lib/citizenLabels';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function Claims() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const categories = CATEGORY_ORDER;

  const claims = useMemo(() => {
    return listClaims({
      search: search || undefined,
      status: statusFilter !== 'all' ? (statusFilter as ClaimStatus) : undefined,
      category: categoryFilter !== 'all' ? (categoryFilter as NormalizedCategory) : undefined,
    });
  }, [search, statusFilter, categoryFilter]);

  return (
    <div className="py-8 px-4">
      <div className="container">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">Facts & Citations</h1>
          <p className="text-muted-foreground">
            Browse all recorded facts with source citations.
          </p>
        </header>

        <div className="bg-card border border-border rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Filters</span>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="pl-10" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="unverified">Not yet verified</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map((cat) => (<SelectItem key={cat} value={cat}>{CATEGORY_LABELS[cat]}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-4">{claims.length} facts found</p>

        <div className="space-y-3">
          {claims.map((claim) => (
            <Link key={claim.id} to={`/admin/claims/${claim.id}`} className="block bg-card border border-border rounded-lg p-4 hover:shadow-md transition-all group">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-medium text-muted-foreground uppercase">{CATEGORY_LABELS[claim.category]}</span>
                    <StatusBadge status={claim.status} />
                  </div>
                  <h3 className="font-medium text-foreground group-hover:text-primary transition-colors mb-1">{generateClaimTitle(claim)}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">{claim.text}</p>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Link>
          ))}
        </div>

        {claims.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-foreground mb-2">No facts found</h3>
          </div>
        )}
      </div>
    </div>
  );
}
