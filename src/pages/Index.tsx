import { Link } from 'react-router-dom';
import { Building2, Database, FileText, Link2, CheckCircle, AlertCircle, Clock, XCircle, ArrowRight } from 'lucide-react';
import { getStats, listAgencies, listServices } from '@/lib/kbStore';
import { GlobalSearch } from '@/components/GlobalSearch';
import { StatsCard } from '@/components/StatsCard';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';

export default function Index() {
  const stats = getStats();
  const agencies = listAgencies();
  const services = listServices();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/5 via-background to-accent/10 py-16 px-4">
        <div className="container max-w-4xl text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-6">
            <Building2 className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 tracking-tight">
            Bangladesh Government Services
          </h1>
          <p className="text-xl text-primary font-medium mb-2">Knowledge Base</p>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
            Your trusted guide to Bangladesh government services. All information is sourced directly from official government websites.
            Always verify before taking action.
          </p>
          
          <GlobalSearch 
            className="max-w-xl mx-auto" 
            placeholder="Search for services, claims, or sources..."
          />
        </div>
      </section>

      {/* Stats Row */}
      <section className="py-8 px-4 border-b border-border">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatsCard label="Agencies" value={stats.agencies} icon={Building2} />
            <StatsCard label="Services" value={stats.services} icon={Database} />
            <StatsCard label="Claims" value={stats.claims} icon={FileText} />
            <StatsCard label="Source Pages" value={stats.sourcepages} icon={Link2} />
          </div>

          {/* Status Breakdown */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
            <span className="text-sm text-muted-foreground">Claims by status:</span>
            <div className="flex flex-wrap gap-3">
              {stats.statusBreakdown.verified && (
                <div className="flex items-center gap-1.5 text-sm">
                  <CheckCircle className="w-4 h-4 text-status-verified" />
                  <span>{stats.statusBreakdown.verified} verified</span>
                </div>
              )}
              {stats.statusBreakdown.unverified && (
                <div className="flex items-center gap-1.5 text-sm">
                  <AlertCircle className="w-4 h-4 text-status-unverified" />
                  <span>{stats.statusBreakdown.unverified} unverified</span>
                </div>
              )}
              {stats.statusBreakdown.stale && (
                <div className="flex items-center gap-1.5 text-sm">
                  <Clock className="w-4 h-4 text-status-stale" />
                  <span>{stats.statusBreakdown.stale} stale</span>
                </div>
              )}
              {stats.statusBreakdown.deprecated && (
                <div className="flex items-center gap-1.5 text-sm">
                  <XCircle className="w-4 h-4 text-status-deprecated" />
                  <span>{stats.statusBreakdown.deprecated} deprecated</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Browse Sections */}
      <section className="py-12 px-4">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Browse by Agency */}
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-accent-foreground" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">Browse by Agency</h2>
              </div>
              <div className="space-y-3">
                {agencies.map((agency) => {
                  const agencyServices = services.filter(s => s.agency_id === agency.id);
                  return (
                    <Link
                      key={agency.id}
                      to={`/services?agency=${agency.id}`}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 transition-colors group"
                    >
                      <div>
                        <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                          {agency.short_name}
                        </p>
                        <p className="text-sm text-muted-foreground">{agency.name}</p>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{agencyServices.length} services</span>
                        <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Browse by Service */}
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
                  <Database className="w-5 h-5 text-accent-foreground" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">Popular Services</h2>
              </div>
              <div className="space-y-3">
                {services.slice(0, 5).map((service) => (
                  <Link
                    key={service.id}
                    to={`/services/${service.id}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <Database className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                          {service.name}
                        </p>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {service.description}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={service.status || 'unverified'} />
                  </Link>
                ))}
              </div>
              <Button asChild variant="outline" className="w-full mt-4">
                <Link to="/services">
                  View All Services
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-12 px-4 bg-muted/30 border-t border-border">
        <div className="container max-w-4xl">
          <h2 className="text-2xl font-semibold text-foreground text-center mb-8">
            How this works
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Link2 className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Official sources</h3>
              <p className="text-sm text-muted-foreground">
                All information comes directly from official government websites.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Source links provided</h3>
              <p className="text-sm text-muted-foreground">
                Every piece of information links back to the official page where it was found.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Verification status</h3>
              <p className="text-sm text-muted-foreground">
                We indicate whether information has been independently verified or needs checking.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
