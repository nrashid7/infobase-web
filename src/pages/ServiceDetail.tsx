import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Database, ExternalLink, ArrowLeft, Globe, FileText, Clock, ClipboardList, DollarSign, Link2 } from 'lucide-react';
import { 
  getServiceById, 
  getClaimsByService, 
  getAgencyById, 
  NormalizedClaim,
} from '@/lib/kbStore';
import { Button } from '@/components/ui/button';
import {
  ApplicationTypeSelector,
  ApplicationType,
  detectApplicationTypes,
  StepsList,
  FeesTableGuide,
  DocumentsChecklistGuide,
  ProcessingTimeGuide,
  OfficialLinksGuide,
} from '@/components/ServiceGuide';

export default function ServiceDetail() {
  const { id } = useParams<{ id: string }>();
  const [applicationType, setApplicationType] = useState<ApplicationType>('regular');
  
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

  // Group claims by category
  const feeClaims = allClaims.filter(c => c.category === 'fees');
  const stepClaims = allClaims.filter(c => c.category === 'application_steps');
  const docClaims = allClaims.filter(c => c.category === 'required_documents');
  const timeClaims = allClaims.filter(c => c.category === 'processing_time');
  const linkClaims = allClaims.filter(c => c.category === 'portal_links');
  const eligibilityClaims = allClaims.filter(c => c.category === 'eligibility');
  const infoClaims = allClaims.filter(c => c.category === 'service_info');

  // Check if this service has structured guide content
  const hasStructuredGuide = stepClaims.length > 0 || feeClaims.length > 0 || docClaims.length > 0;

  // Detect application types from fee claims
  const applicationTypes = detectApplicationTypes(feeClaims);

  // Set initial application type
  if (applicationTypes.length > 0 && !applicationTypes.includes(applicationType)) {
    setApplicationType(applicationTypes[0]);
  }

  return (
    <div className="py-8 px-4">
      <div className="container max-w-3xl">
        {/* Back link */}
        <Link
          to="/services"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          All Services
        </Link>

        {/* Header */}
        <header className="mb-8">
          <p className="text-sm text-primary font-medium mb-2">
            {agency?.short_name || agency?.name || 'Government Service'}
          </p>
          <h1 className="text-3xl font-bold text-foreground mb-3">{service.name || 'Service Guide'}</h1>
          {service.description && (
            <p className="text-muted-foreground text-lg">{service.description}</p>
          )}

          {/* Primary action button */}
          {service.portal_url && (
            <Button asChild size="lg" className="mt-6">
              <a
                href={service.portal_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Globe className="w-4 h-4 mr-2" />
                Apply on Official Portal
                <ExternalLink className="w-4 h-4 ml-2" />
              </a>
            </Button>
          )}
        </header>

        {/* Application Type Selector */}
        <ApplicationTypeSelector
          types={applicationTypes}
          selected={applicationType}
          onChange={setApplicationType}
        />

        {/* Main Guide Content */}
        <div className="space-y-10">
          
          {/* For services without structured guide, show service info prominently */}
          {!hasStructuredGuide && infoClaims.length > 0 && (
            <section>
              <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground mb-4">
                <FileText className="w-5 h-5 text-primary" />
                Available services
              </h2>
              <div className="space-y-3">
                {infoClaims.map((claim, idx) => (
                  <div 
                    key={idx} 
                    className="bg-card border border-border rounded-lg p-4 flex items-start gap-3"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-primary font-medium text-sm">{idx + 1}</span>
                    </div>
                    <p className="text-foreground">{claim.text}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Eligibility (if present) */}
          {eligibilityClaims.length > 0 && (
            <section>
              <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground mb-4">
                <span className="text-xl">👤</span>
                Who can apply
              </h2>
              <div className="bg-card border border-border rounded-lg p-4">
                {eligibilityClaims.map((claim, idx) => (
                  <p key={idx} className="text-foreground">{claim.text}</p>
                ))}
              </div>
            </section>
          )}

          {/* How to Apply - Steps */}
          {stepClaims.length > 0 && (
            <section>
              <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground mb-4">
                <ClipboardList className="w-5 h-5 text-primary" />
                How to apply
              </h2>
              <StepsList claims={stepClaims} />
            </section>
          )}

          {/* Fees */}
          {feeClaims.length > 0 && (
            <section>
              <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground mb-4">
                <DollarSign className="w-5 h-5 text-primary" />
                Fees
              </h2>
              <FeesTableGuide claims={feeClaims} applicationType={applicationType} />
            </section>
          )}

          {/* Required Documents */}
          {docClaims.length > 0 && (
            <section>
              <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground mb-4">
                <FileText className="w-5 h-5 text-primary" />
                Required documents
              </h2>
              <DocumentsChecklistGuide claims={docClaims} />
            </section>
          )}

          {/* Processing Time */}
          {timeClaims.length > 0 && (
            <section>
              <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground mb-4">
                <Clock className="w-5 h-5 text-primary" />
                Processing time
              </h2>
              <ProcessingTimeGuide claims={timeClaims} applicationType={applicationType} />
            </section>
          )}

          {/* Official Links */}
          {(linkClaims.length > 0 || service.portal_url) && (
            <section>
              <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground mb-4">
                <Link2 className="w-5 h-5 text-primary" />
                Official links
              </h2>
              <OfficialLinksGuide service={service} claims={linkClaims} />
            </section>
          )}

          {/* General Info - only show if we have structured guide AND extra info */}
          {hasStructuredGuide && infoClaims.length > 0 && (
            <section>
              <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground mb-4">
                <span className="text-xl">ℹ️</span>
                Additional information
              </h2>
              <div className="space-y-3">
                {infoClaims.map((claim, idx) => (
                  <div key={idx} className="bg-card border border-border rounded-lg p-4">
                    <p className="text-foreground">{claim.text}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

        </div>

        {/* Empty state */}
        {allClaims.length === 0 && (
          <div className="text-center py-12 bg-muted/30 rounded-lg">
            <Database className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-foreground mb-2">Information coming soon</h3>
            <p className="text-muted-foreground">
              We're still gathering details for this service. Check back later or visit the official portal.
            </p>
            {service.portal_url && (
              <Button asChild variant="outline" className="mt-4">
                <a href={service.portal_url} target="_blank" rel="noopener noreferrer">
                  Visit Official Portal
                  <ExternalLink className="w-4 h-4 ml-2" />
                </a>
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
