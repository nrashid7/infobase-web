import { useParams, Link } from 'react-router-dom';
import { Database, ExternalLink, ArrowLeft, AlertTriangle, CheckCircle } from 'lucide-react';
import { getServiceById, getClaimsByService, getAgencyById, getClaimCategories, Claim } from '@/lib/kbStore';
import { StatusBadge } from '@/components/StatusBadge';
import { ClaimCard } from '@/components/ClaimCard';
import { WarningBanner } from '@/components/WarningBanner';
import { Button } from '@/components/ui/button';

const categoryLabels: Record<string, string> = {
  eligibility: 'Eligibility',
  fees: 'Fees',
  required_documents: 'Required Documents',
  processing_time: 'Processing Time',
  application_steps: 'Application Steps',
  portal_links: 'Portal Links',
};

const categoryIcons: Record<string, string> = {
  eligibility: '👤',
  fees: '💰',
  required_documents: '📄',
  processing_time: '⏱️',
  application_steps: '📋',
  portal_links: '🔗',
};

export default function ServiceDetail() {
  const { id } = useParams<{ id: string }>();
  const service = id ? getServiceById(id) : undefined;
  const claims = id ? getClaimsByService(id) : [];
  const agency = service ? getAgencyById(service.agency_id) : undefined;
  const allCategories = getClaimCategories();

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

  // Group claims by category
  const claimsByCategory = claims.reduce((acc, claim) => {
    if (!acc[claim.category]) {
      acc[claim.category] = [];
    }
    acc[claim.category].push(claim);
    return acc;
  }, {} as Record<string, Claim[]>);

  // Find missing categories
  const presentCategories = Object.keys(claimsByCategory);
  const missingCategories = allCategories.filter(cat => !presentCategories.includes(cat));

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
            <span>{agency?.short_name}</span>
          </div>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <h1 className="text-3xl font-bold text-foreground">{service.name}</h1>
            <StatusBadge status={service.status} size="md" />
          </div>
          <p className="text-muted-foreground mt-2">{service.description}</p>

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
            message="Some claims for this service may be incomplete or outdated. See citations and verify on the official portal."
            className="mb-8"
          />
        )}

        {/* Verification Summary */}
        <div className="bg-card border border-border rounded-lg p-4 mb-8">
          <h2 className="font-semibold text-foreground mb-3">Verification Summary</h2>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-status-verified" />
              <span>{claims.filter(c => c.status === 'verified').length} verified</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-status-unverified" />
              <span>{claims.filter(c => c.status === 'unverified').length} unverified</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Total: {claims.length} claims</span>
            </div>
          </div>
        </div>

        {/* Claims Checklist by Category */}
        <div className="space-y-8">
          <h2 className="text-xl font-semibold text-foreground">Claims Checklist</h2>

          {allCategories.map((category) => {
            const categoryClaims = claimsByCategory[category] || [];
            if (categoryClaims.length === 0) return null;

            return (
              <div key={category} className="category-section">
                <h3 className="text-lg font-medium text-foreground mb-4 flex items-center gap-2">
                  <span>{categoryIcons[category]}</span>
                  {categoryLabels[category]}
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
          })}
        </div>

        {/* What's Missing */}
        {missingCategories.length > 0 && (
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
                  {categoryIcons[category]} {categoryLabels[category]}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
