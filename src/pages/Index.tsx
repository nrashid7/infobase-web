import { Link } from 'react-router-dom';
import { Building2, ArrowRight, CheckCircle, Shield, Clock, FileCheck } from 'lucide-react';
import { getStats, listServices } from '@/lib/kbStore';
import { GlobalSearch } from '@/components/GlobalSearch';
import { Button } from '@/components/ui/button';

// Category chips for quick navigation
const categoryChips = [
  { label: 'Passport', search: 'passport' },
  { label: 'NID', search: 'nid' },
  { label: 'Driving License', search: 'driving' },
  { label: 'Birth Certificate', search: 'birth' },
  { label: 'Visa', search: 'visa' },
];

export default function Index() {
  const stats = getStats();
  const services = listServices();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/5 via-background to-accent/10 py-20 px-4">
        <div className="container max-w-4xl text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-6">
            <Building2 className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 tracking-tight">
            Bangladesh Government Services
          </h1>
          <p className="text-xl text-primary font-medium mb-3">Step-by-step guides with official citations</p>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
            Find clear instructions, fees, required documents, and processing times for government services.
            All information is sourced from official portals.
          </p>
          
          <GlobalSearch 
            className="max-w-xl mx-auto mb-6" 
            placeholder="Search for a service (e.g., passport, NID, visa)..."
          />

          {/* Category Chips */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            {categoryChips.map((chip) => (
              <Link
                key={chip.label}
                to={`/services?search=${chip.search}`}
                className="px-4 py-2 bg-card border border-border rounded-full text-sm font-medium text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
              >
                {chip.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Simple Stats */}
      <section className="py-6 px-4 border-b border-border bg-muted/30">
        <div className="container">
          <div className="flex flex-wrap items-center justify-center gap-8 text-center text-sm text-muted-foreground">
            <span><strong className="text-foreground">{stats.services}</strong> services documented</span>
            <span>•</span>
            <span><strong className="text-foreground">{stats.agencies}</strong> government agencies</span>
            <span>•</span>
            <span>Updated regularly</span>
          </div>
        </div>
      </section>

      {/* Featured Services */}
      <section className="py-12 px-4">
        <div className="container max-w-4xl">
          <h2 className="text-xl font-semibold text-foreground text-center mb-8">
            Popular Service Guides
          </h2>
          
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            {services.slice(0, 4).map((service) => (
              <Link
                key={service.id}
                to={`/services/${service.id}`}
                className="bg-card border border-border rounded-xl p-5 hover:shadow-lg hover:border-primary/30 transition-all group"
              >
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors mb-2">
                  {service.name}
                </h3>
                {service.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                    {service.description}
                  </p>
                )}
                <span className="text-sm text-primary font-medium inline-flex items-center gap-1">
                  View guide
                  <ArrowRight className="w-4 h-4" />
                </span>
              </Link>
            ))}
          </div>

          <div className="text-center">
            <Button asChild variant="outline" size="lg">
              <Link to="/services">
                Browse All Services
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-12 px-4 bg-muted/30 border-t border-border">
        <div className="container max-w-4xl">
          <h2 className="text-xl font-semibold text-foreground text-center mb-8">
            Why use INFOBASE?
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <FileCheck className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Official sources</h3>
              <p className="text-sm text-muted-foreground">
                Every piece of information comes from official government websites with citations you can verify.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Easy to follow</h3>
              <p className="text-sm text-muted-foreground">
                Clear step-by-step instructions with fees, documents, and timelines all in one place.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Clock className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Save time</h3>
              <p className="text-sm text-muted-foreground">
                No more hunting through multiple websites. Get all the information you need in one guide.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="py-8 px-4 bg-background border-t border-border">
        <div className="container max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 text-muted-foreground text-sm">
            <Shield className="w-4 h-4" />
            <span>
              This is an unofficial guide. Always verify on{' '}
              <Link to="/about" className="text-primary hover:underline">official sources</Link>
              {' '}before taking action.
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
