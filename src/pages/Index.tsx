import { Link } from 'react-router-dom';
import { Building2, Database, ArrowRight, CheckCircle } from 'lucide-react';
import { getStats, listAgencies, listServices } from '@/lib/kbStore';
import { GlobalSearch } from '@/components/GlobalSearch';
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
          <p className="text-xl text-primary font-medium mb-2">Your Trusted Guide</p>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
            Find step-by-step instructions, fees, required documents, and processing times for government services.
            All information comes from official sources.
          </p>
          
          <GlobalSearch 
            className="max-w-xl mx-auto" 
            placeholder="Search for services (e.g., passport, visa, NID)..."
          />
        </div>
      </section>

      {/* Stats Row */}
      <section className="py-8 px-4 border-b border-border">
        <div className="container">
          <div className="flex flex-wrap items-center justify-center gap-8 text-center">
            <div>
              <p className="text-3xl font-bold text-foreground">{stats.services}</p>
              <p className="text-sm text-muted-foreground">Services</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-foreground">{stats.agencies}</p>
              <p className="text-sm text-muted-foreground">Agencies</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-foreground">{stats.sourcepages}</p>
              <p className="text-sm text-muted-foreground">Official sources</p>
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

            {/* Popular Services */}
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
                    <div className="flex items-center gap-3 min-w-0">
                      <Database className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium text-foreground group-hover:text-primary transition-colors truncate">
                          {service.name}
                        </p>
                        {service.description && (
                          <p className="text-sm text-muted-foreground truncate">
                            {service.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
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
                <Database className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Official information</h3>
              <p className="text-sm text-muted-foreground">
                All details come directly from official government websites and portals.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Easy to follow</h3>
              <p className="text-sm text-muted-foreground">
                Step-by-step guides with fees, documents, and timelines clearly laid out.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <ArrowRight className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Direct links</h3>
              <p className="text-sm text-muted-foreground">
                Every guide includes links to official portals where you can apply.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
