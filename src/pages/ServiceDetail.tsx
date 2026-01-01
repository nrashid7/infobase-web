import { useParams, Link } from 'react-router-dom';
import { Database, ExternalLink, ArrowLeft, AlertTriangle, CheckCircle } from 'lucide-react';
import { 
  getServiceById, 
  getClaimsByService, 
  getAgencyById, 
  NormalizedClaim,
  CATEGORY_ORDER,
  CATEGORY_LABELS,
  CATEGORY_ICONS,
  NormalizedCategory
} from '@/lib/kbStore';
import { StatusBadge } from '@/components/StatusBadge';
import { ClaimCard } from '@/components/ClaimCard';
import { WarningBanner } from '@/components/WarningBanner';
import { Button } from '@/components/ui/button';

export default function ServiceDetail() {
  const { id } = useParams<{ id: string }>();
  const service = id ? getServiceById(id) : undefined;
  const claims = id ? getClaimsByService(id) : [];
  const agency = service?.agency_id ? getAgencyById(service.agency_id) : undefined;

  if (!service) {
    return (
      <div className="py-16 text-center">
        <Database className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-foreground mb-2">Service not found</h2>
        <p className="text-muted-foreground mb-4">The requested service could not be found.</p>
        <Button asChild variant="outline">
          <Link to="/services">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Services
          </Link>
        </Button>
      </div>
    );
  }

  // Group claims by normalized category
  const claimsByCategory: Record<NormalizedCategory, NormalizedClaim[]> = {
    eligibility: [],
    fees: [],
    required_documents: [],
    processing_time: [],
    application_steps: [],
    portal_links: [],
    service_info: [],
  };

  claims.forEach(claim => {
    const cat = claim.category;
    if (claimsByCategory[cat]) {
      claimsByCategory[cat].push(claim);
    } else {
      // Fallback to service_info if somehow category is unknown
      claimsByCategory.service_info.push(claim);
    }
  });

  // Find categories with claims
  const presentCategories = CATEGORY_ORDER.filter(cat => claimsByCategory[cat].length > 0);
  
  // Find missing categories (exclude service_info from "missing" since it's a catch-all)
  const missingCategories = CATEGORY_ORDER.filter(
    cat => cat !== 'service_info' && claimsByCategory[cat].length === 0
  );

  // Check if any claims need warning
  const hasUnverifiedOrStale = claims.some(c => 
    c.status === 'unverified' || c.status === 'stale' || c.status === 'deprecated'
  );

  return (
    <div className="py-8 px-4">
      <div className="container max-w-4xl">
        {/* Back link */}
        <Link
          to="/services"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Services
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Database className="w-4 h-4" />
            <span>{agency?.short_name || agency?.name || 'Unknown Agency'}</span>
          </div>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <h1 className="text-3xl font-bold text-foreground">{service.name || 'Unnamed Service'}</h1>
            <StatusBadge status={service.status} size="md" />
          </div>
          {service.description && (
            <p className="text-muted-foreground mt-2">{service.description}</p>
          )}

          {service.portal_url && (
            <a
              href={service.portal_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-4 text-primary hover:underline"
            >
              <ExternalLink className="w-4 h-4" />
              Visit Official Portal
            </a>
          )}
        </div>

        {/* Warning Banner */}
        {hasUnverifiedOrStale && (
          <WarningBanner
            message="Some information may be incomplete or outdated. Always verify on the official portal before taking action."
            className="mb-8"
          />
        )}

        {/* Information Status */}
        <div className="bg-card border border-border rounded-lg p-4 mb-8">
          <h2 className="font-semibold text-foreground mb-3">Information status</h2>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-status-verified" />
              <span>{claims.filter(c => c.status === 'verified').length} verified</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-status-unverified" />
              <span>{claims.filter(c => c.status === 'unverified').length} pending verification</span>
            </div>
          </div>
        </div>

        {/* What you need to know - by Category */}
        <div className="space-y-8">
          <h2 className="text-xl font-semibold text-foreground">What you need to know</h2>

          {claims.length === 0 ? (
            <p className="text-muted-foreground">No claims have been recorded for this service yet.</p>
          ) : (
            CATEGORY_ORDER.map((category) => {
              const categoryClaims = claimsByCategory[category];
              if (categoryClaims.length === 0) return null;

              return (
                <div key={category} className="category-section">
                  <h3 className="text-lg font-medium text-foreground mb-4 flex items-center gap-2">
                    <span>{CATEGORY_ICONS[category] || 'ℹ️'}</span>
                    {CATEGORY_LABELS[category] || category}
                    <span className="text-sm font-normal text-muted-foreground">
                      ({categoryClaims.length})
                    </span>
                  </h3>
                  <div className="space-y-4">
                    {categoryClaims.map((claim) => (
                      <ClaimCard key={claim.id} claim={claim} />
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* What's Missing */}
        {missingCategories.length > 0 && claims.length > 0 && (
          <div className="mt-8 bg-muted/50 border border-border rounded-lg p-6">
            <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-muted-foreground" />
              What's Missing
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              No claims have been recorded for the following categories:
            </p>
            <div className="flex flex-wrap gap-2">
              {missingCategories.map((category) => (
                <span
                  key={category}
                  className="px-3 py-1 bg-card border border-border rounded-full text-sm text-muted-foreground"
                >
                  {CATEGORY_ICONS[category] || 'ℹ️'} {CATEGORY_LABELS[category] || category}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
