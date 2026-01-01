import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Database, ExternalLink, ArrowLeft, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { 
  getServiceById, 
  getClaimsByService, 
  getAgencyById, 
  NormalizedClaim,
  CATEGORY_ORDER,
  CATEGORY_LABELS,
  CATEGORY_ICONS,
  NormalizedCategory,
  getSourcePageById
} from '@/lib/kbStore';
import { ClaimCard } from '@/components/ClaimCard';
import { WarningBanner } from '@/components/WarningBanner';
import { ServiceStatusBanner } from '@/components/ServiceStatusBanner';
import { VerifiedOnlyToggle } from '@/components/VerifiedOnlyToggle';
import { Button } from '@/components/ui/button';
import {
  FeesTable,
  StepsList,
  DocumentsChecklist,
  ProcessingTimeCallout,
  PortalLinksButtons
} from '@/components/ServiceGuide';

export default function ServiceDetail() {
  const { id } = useParams<{ id: string }>();
  const [showOnlyVerified, setShowOnlyVerified] = useState(false);
  const [showAuditSection, setShowAuditSection] = useState(false);
  
  const service = id ? getServiceById(id) : undefined;
  const allClaims = id ? getClaimsByService(id) : [];
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

  // Filter claims if verified-only is enabled
  const claims = showOnlyVerified 
    ? allClaims.filter(c => c.status === 'verified')
    : allClaims;

  // Get verification stats
  const verifiedCount = allClaims.filter(c => c.status === 'verified').length;
  const totalCount = allClaims.length;

  // Get last crawled date from sources
  const lastCrawled = allClaims.reduce((latest, claim) => {
    claim.citations.forEach(cit => {
      const source = getSourcePageById(cit.source_page_id);
      if (source?.fetched_at && (!latest || source.fetched_at > latest)) {
        latest = source.fetched_at;
      }
    });
    return latest;
  }, null as string | null);

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
      claimsByCategory.service_info.push(claim);
    }
  });

  // Find categories with claims (for guide display)
  const presentCategories = CATEGORY_ORDER.filter(cat => claimsByCategory[cat].length > 0);
  
  // Check if any claims need warning
  const hasUnverifiedOrStale = allClaims.some(c => 
    c.status === 'unverified' || c.status === 'stale' || c.status === 'deprecated'
  );

  // Render category content based on type
  const renderCategoryContent = (category: NormalizedCategory, categoryClaims: NormalizedClaim[]) => {
    switch (category) {
      case 'fees':
        return <FeesTable claims={categoryClaims} />;
      case 'application_steps':
        return <StepsList claims={categoryClaims} />;
      case 'required_documents':
        return <DocumentsChecklist claims={categoryClaims} />;
      case 'processing_time':
        return <ProcessingTimeCallout claims={categoryClaims} />;
      case 'portal_links':
        return <PortalLinksButtons claims={categoryClaims} />;
      default:
        return (
          <div className="space-y-3">
            {categoryClaims.map((claim) => (
              <ClaimCard key={claim.id} claim={claim} />
            ))}
          </div>
        );
    }
  };

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
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Database className="w-4 h-4" />
            <span>{agency?.short_name || agency?.name || 'Government Service'}</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground">{service.name || 'Service Guide'}</h1>
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

        {/* Status Banner */}
        <ServiceStatusBanner
          status={service.status}
          verifiedCount={verifiedCount}
          totalCount={totalCount}
          lastCrawled={lastCrawled}
          className="mb-6"
        />

        {/* Verified-only toggle */}
        <div className="flex items-center justify-between bg-card border border-border rounded-lg p-4 mb-8">
          <span className="text-sm text-muted-foreground">Filter content</span>
          <VerifiedOnlyToggle 
            checked={showOnlyVerified} 
            onCheckedChange={setShowOnlyVerified} 
          />
        </div>

        {/* Warning Banner */}
        {hasUnverifiedOrStale && !showOnlyVerified && (
          <WarningBanner
            message="Some information may be incomplete or outdated. Always verify on the official portal before taking action."
            className="mb-8"
          />
        )}

        {/* Service Guide Content */}
        <div className="space-y-10">
          <h2 className="text-xl font-semibold text-foreground">Service Guide</h2>

          {claims.length === 0 ? (
            <div className="text-center py-8 bg-muted/30 rounded-lg">
              <p className="text-muted-foreground">
                {showOnlyVerified 
                  ? 'No verified information available. Toggle off the filter to see all information.'
                  : 'No information has been recorded for this service yet.'}
              </p>
            </div>
          ) : (
            presentCategories.map((category) => {
              const categoryClaims = claimsByCategory[category];
              if (categoryClaims.length === 0) return null;

              return (
                <section key={category} className="pb-8 border-b border-border last:border-0">
                  <h3 className="text-lg font-medium text-foreground mb-4 flex items-center gap-2">
                    <span>{CATEGORY_ICONS[category] || 'ℹ️'}</span>
                    {CATEGORY_LABELS[category] || category}
                  </h3>
                  {renderCategoryContent(category, categoryClaims)}
                </section>
              );
            })
          )}
        </div>

        {/* Transparency / Audit Section */}
        <div className="mt-12 pt-8 border-t border-border">
          <button
            onClick={() => setShowAuditSection(!showAuditSection)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showAuditSection ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
            <span className="text-sm font-medium">Transparency / Audit</span>
          </button>

          {showAuditSection && (
            <div className="mt-6 space-y-4">
              <p className="text-sm text-muted-foreground">
                Complete list of all {allClaims.length} facts recorded for this service.
              </p>
              <div className="space-y-3">
                {allClaims.map((claim) => (
                  <ClaimCard key={claim.id} claim={claim} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
