import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  BookOpen, 
  ExternalLink, 
  Globe, 
  FileText, 
  Clock, 
  ClipboardList, 
  DollarSign, 
  Link2, 
  AlertTriangle, 
  Users,
  ChevronDown,
  ChevronRight,
  ArrowLeft
} from 'lucide-react';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { 
  getGuideById, 
  getVariantTypes, 
  getFeesForVariant,
  formatLocator,
  type Guide,
  type Citation,
  type VariantType,
  type Step,
  type SectionItem,
  type VariantFee,
  type FeeItem
} from '@/lib/guidesStore';
import { useLanguage } from '@/lib/LanguageContext';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

// Variant selector component
function VariantSelector({ 
  variants, 
  selected, 
  onChange 
}: { 
  variants: VariantType[]; 
  selected: VariantType; 
  onChange: (v: VariantType) => void;
}) {
  const { t } = useLanguage();
  
  if (variants.length <= 1) return null;

  const labels: Record<VariantType, { name: string; desc: string }> = {
    regular: { name: t('guide.variant.regular'), desc: t('guide.variant.regular.desc') },
    express: { name: t('guide.variant.express'), desc: t('guide.variant.express.desc') },
    super_express: { name: t('guide.variant.super_express'), desc: t('guide.variant.super_express.desc') },
  };

  return (
    <div className="mb-8">
      <h3 className="text-sm font-medium text-muted-foreground mb-3">{t('guide.applicationType')}</h3>
      <div className="flex flex-wrap gap-2">
        {variants.map((v) => (
          <button
            key={v}
            onClick={() => onChange(v)}
            className={`px-4 py-3 rounded-lg border text-left transition-all ${
              selected === v
                ? 'border-primary bg-primary/5 text-foreground'
                : 'border-border bg-card text-muted-foreground hover:border-primary/50'
            }`}
          >
            <span className="font-medium block">{labels[v].name}</span>
            <span className="text-xs">{labels[v].desc}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// Citation accordion component
function CitationAccordion({ citations }: { citations: Citation[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useLanguage();

  if (!citations || citations.length === 0) return null;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mt-2">
        {isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        {t('action.showSources')} ({citations.length})
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2 space-y-2">
        {citations.map((c, idx) => (
          <div key={idx} className="text-xs bg-muted/50 rounded p-2 space-y-1">
            <a 
              href={c.canonical_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline flex items-center gap-1"
            >
              {c.domain}
              <ExternalLink className="w-3 h-3" />
            </a>
            {c.locator && (
              <p className="text-muted-foreground">{formatLocator(c.locator)}</p>
            )}
            {c.quoted_text && (
              <p className="text-muted-foreground italic">"{c.quoted_text}"</p>
            )}
          </div>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}

// Steps section
function StepsSection({ steps }: { steps: Step[] }) {
  return (
    <ol className="space-y-4">
      {steps.map((step) => (
        <li key={step.step_number} className="flex gap-4">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
            {step.step_number}
          </div>
          <div className="flex-1 pt-1">
            <h4 className="font-semibold text-foreground">{step.title}</h4>
            <p className="text-muted-foreground mt-1">{step.description}</p>
            <CitationAccordion citations={step.citations} />
          </div>
        </li>
      ))}
    </ol>
  );
}

// Documents checklist
function DocumentsSection({ items }: { items: SectionItem[] }) {
  return (
    <ul className="space-y-3">
      {items.map((item, idx) => (
        <li key={idx} className="flex items-start gap-3">
          <div className="w-5 h-5 rounded-full border-2 border-primary flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-foreground">{item.label}</p>
            {item.description && (
              <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
            )}
            <CitationAccordion citations={item.citations} />
          </div>
        </li>
      ))}
    </ul>
  );
}

// Fees table
function FeesSection({ fees, processingTimes }: { fees: (VariantFee | FeeItem)[]; processingTimes?: SectionItem[] }) {
  const { t } = useLanguage();
  const hasStructuredData = fees.some(f => 'structured_data' in f && f.structured_data);

  // Build a map from delivery_type to processing time from the processing_time section
  const processingTimeMap = new Map<string, string>();
  if (processingTimes) {
    for (const pt of processingTimes) {
      const label = pt.label.toLowerCase();
      if (label.includes('regular')) processingTimeMap.set('regular', pt.label.replace(/^regular\s*(delivery)?:\s*/i, ''));
      if (label.includes('express') && !label.includes('super')) processingTimeMap.set('express', pt.label.replace(/^express\s*(delivery)?:\s*/i, ''));
      if (label.includes('super')) processingTimeMap.set('super_express', pt.label.replace(/^super\s*express\s*(delivery)?:\s*/i, ''));
    }
  }

  if (hasStructuredData) {
    const hasPages = fees.some(f => 'structured_data' in f && f.structured_data?.pages);
    const hasDeliveryDays = fees.some(f => 'structured_data' in f && f.structured_data?.delivery_days);
    const hasProcessingInfo = hasDeliveryDays || processingTimeMap.size > 0;

    return (
      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50">
              <th className="text-left py-3 px-4 font-semibold text-foreground">{t('table.type')}</th>
              {hasPages && (
                <th className="text-left py-3 px-4 font-semibold text-foreground">{t('table.pages')}</th>
              )}
              {hasProcessingInfo && (
                <th className="text-left py-3 px-4 font-semibold text-foreground">{t('table.delivery')}</th>
              )}
              <th className="text-right py-3 px-4 font-semibold text-foreground">{t('table.amount')}</th>
            </tr>
          </thead>
          <tbody>
            {fees.map((fee, idx) => {
              const data = 'structured_data' in fee ? fee.structured_data : null;
              const label = 'text' in fee ? fee.text : fee.label;
              const deliveryType = data?.delivery_type || '';
              const processingLabel = processingTimeMap.get(deliveryType);

              return (
                <tr key={idx} className={`border-t border-border/50 ${idx % 2 === 1 ? 'bg-muted/30' : ''}`}>
                  <td className="py-3.5 px-4 text-foreground capitalize font-medium">
                    {deliveryType.replace(/_/g, ' ') || label}
                  </td>
                  {hasPages && (
                    <td className="py-3.5 px-4 text-foreground">
                      {data?.pages ? `${data.pages} pages` : '—'}
                    </td>
                  )}
                  {hasProcessingInfo && (
                    <td className="py-3.5 px-4 text-muted-foreground">
                      {data?.delivery_days 
                        ? `${data.delivery_days} ${t('table.workingDays')}` 
                        : processingLabel || '—'}
                    </td>
                  )}
                  <td className="py-3.5 px-4 text-right">
                    <span className="font-bold text-base text-primary">
                      {data?.amount_bdt ? `৳${data.amount_bdt.toLocaleString()}` : '—'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  // Simple list for unstructured fees
  return (
    <ul className="space-y-3">
      {fees.map((fee, idx) => {
        const label = 'text' in fee ? fee.text : fee.label;
        return (
          <li key={idx} className="flex items-start gap-3 py-2 border-b border-border/50 last:border-0">
            <DollarSign className="w-4 h-4 text-primary flex-shrink-0 mt-1" />
            <div className="flex-1">
              <p className="text-foreground">{label}</p>
              <CitationAccordion citations={fee.citations} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

// Service info section
function ServiceInfoSection({ items }: { items: SectionItem[] }) {
  return (
    <div className="space-y-3">
      {items.map((item, idx) => (
        <div key={idx} className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="text-primary font-medium text-sm">{idx + 1}</span>
          </div>
          <div className="flex-1">
            <p className="text-foreground">{item.label}</p>
            {item.description && (
              <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
            )}
            <CitationAccordion citations={item.citations} />
          </div>
        </div>
      ))}
    </div>
  );
}

// Official links section  
function OfficialLinksSection({ guide }: { guide: Guide }) {
  const links = guide.official_links || [];
  
  // Deduplicate links by URL
  const uniqueLinks = links.reduce((acc, link) => {
    if (!acc.find(l => l.url === link.url)) {
      acc.push(link);
    }
    return acc;
  }, [] as typeof links);

  if (uniqueLinks.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-3">
      {uniqueLinks.map((link, idx) => (
        <Button key={idx} asChild variant={idx === 0 ? 'default' : 'outline'}>
          <a href={link.url} target="_blank" rel="noopener noreferrer">
            <Globe className="w-4 h-4 mr-2" />
            {link.label || 'Official Portal'}
            <ExternalLink className="w-3 h-3 ml-2" />
          </a>
        </Button>
      ))}
    </div>
  );
}

export default function GuideDetail() {
  const { id } = useParams<{ id: string }>();
  const [selectedVariant, setSelectedVariant] = useState<VariantType>('regular');
  const { t, language } = useLanguage();
  
  const guide = id ? getGuideById(id) : undefined;

  if (!guide) {
    return (
      <div className="py-16 text-center">
        <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-foreground mb-2">{t('empty.guideNotFound')}</h2>
        <p className="text-muted-foreground mb-4">{t('empty.guideNotFoundDesc')}</p>
        <Button asChild variant="outline">
          <Link to="/guides">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('guide.backToGuides')}
          </Link>
        </Button>
      </div>
    );
  }

  // Coming soon state
  const isComingSoon = guide.meta?.status === 'coming_soon';

  if (isComingSoon) {
    const primaryPortal = guide.official_links?.[0]?.url;
    return (
      <div className="py-8 px-4">
        <div className="container max-w-3xl">
          <Breadcrumbs 
            items={[
              { label: language === 'bn' ? 'গাইড' : 'Guides', href: '/guides' },
              { label: guide.title }
            ]} 
            className="mb-6"
          />
          <header className="mb-6">
            <p className="text-sm text-primary font-medium mb-2">{guide.agency_name}</p>
            <h1 className="text-3xl font-bold text-foreground mb-3">{guide.title}</h1>
          </header>
          <div className="text-center py-16 bg-muted/30 rounded-xl border border-border">
            <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <BookOpen className="w-8 h-8 text-amber-600 dark:text-amber-400" />
            </div>
            <h3 className="font-semibold text-foreground text-lg mb-2">
              {language === 'bn' ? 'গাইড তৈরি হচ্ছে' : 'Guide Coming Soon'}
            </h3>
            {guide.overview && (
              <p className="text-muted-foreground max-w-md mx-auto mb-2">{guide.overview}</p>
            )}
            <p className="text-sm text-muted-foreground">
              {language === 'bn' 
                ? 'আমরা এই সেবার জন্য বিস্তারিত ধাপ-ভিত্তিক গাইড তৈরি করছি।'
                : 'We are preparing a detailed step-by-step guide for this service.'}
            </p>
            {primaryPortal && (
              <Button asChild variant="outline" className="mt-6">
                <a href={primaryPortal} target="_blank" rel="noopener noreferrer">
                  <Globe className="w-4 h-4 mr-2" />
                  {language === 'bn' ? 'অফিসিয়াল পোর্টাল' : 'Visit Official Portal'}
                  <ExternalLink className="w-4 h-4 ml-2" />
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Get variant types
  const variantTypes = getVariantTypes(guide);
  const currentVariant = variantTypes.includes(selectedVariant) ? selectedVariant : variantTypes[0] || 'regular';

  // Get data for sections
  const steps = guide.steps || guide.sections.application_steps || [];
  const fees = getFeesForVariant(guide, variantTypes.length > 0 ? currentVariant : undefined);
  const documents = guide.required_documents || guide.sections.required_documents || [];
  const eligibility = guide.sections.eligibility || [];
  const processingTime = guide.sections.processing_time || [];
  const serviceInfo = guide.sections.service_info || [];
  const portalLinks = guide.sections.portal_links || [];

  // Check if we have structured content
  const hasStructuredContent = steps.length > 0 || (fees && fees.length > 0) || documents.length > 0;

  // Get primary portal URL
  const primaryPortal = guide.official_links?.find(l => l.label === 'Official Portal')?.url 
    || guide.official_links?.[0]?.url;

  return (
    <div className="py-8 px-4">
      <div className="container max-w-3xl">
        {/* Breadcrumbs */}
        <Breadcrumbs 
          items={[
            { label: language === 'bn' ? 'গাইড' : 'Guides', href: '/guides' },
            { label: guide.title }
          ]} 
          className="mb-6"
        />

        {/* Header */}
        <header className="mb-6">
          <p className="text-sm text-primary font-medium mb-2">
            {guide.agency_name}
          </p>
          <h1 className="text-3xl font-bold text-foreground mb-3">{guide.title}</h1>
          {guide.overview && (
            <p className="text-muted-foreground text-lg mb-4">{guide.overview}</p>
          )}

          {/* Primary action button */}
          {primaryPortal && (
            <Button asChild size="lg" className="mb-4">
              <a href={primaryPortal} target="_blank" rel="noopener noreferrer">
                <Globe className="w-4 h-4 mr-2" />
                {t('guide.applyOnPortal')}
                <ExternalLink className="w-4 h-4 ml-2" />
              </a>
            </Button>
          )}
        </header>

        {/* Disclaimer */}
        <div className="bg-muted/50 border border-border rounded-lg p-4 mb-8 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">
            {language === 'bn' ? (
              <>
                এটি একটি অনানুষ্ঠানিক গাইড। পদক্ষেপ নেওয়ার আগে সর্বদা{' '}
                {primaryPortal ? (
                  <a href={primaryPortal} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    অফিসিয়াল পোর্টালে
                  </a>
                ) : (
                  'অফিসিয়াল সরকারি ওয়েবসাইটে'
                )}{' '}
                তথ্য যাচাই করুন।
              </>
            ) : (
              <>
                This is an unofficial guide. Always verify information on the{' '}
                {primaryPortal ? (
                  <a href={primaryPortal} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    official portal
                  </a>
                ) : (
                  'official government website'
                )}{' '}
                before taking action.
              </>
            )}
          </p>
        </div>

        {/* Variant Selector */}
        <VariantSelector
          variants={variantTypes}
          selected={currentVariant}
          onChange={setSelectedVariant}
        />

        {/* Main Guide Content */}
        <div className="space-y-10">
          
          {/* For guides without structured content, show service info prominently */}
          {!hasStructuredContent && serviceInfo.length > 0 && (
            <section>
              <h2 className="flex items-center gap-2 text-xl font-semibold text-foreground mb-4">
                <FileText className="w-5 h-5 text-primary" />
                {t('section.availableServices')}
              </h2>
              <div className="bg-card border border-border rounded-lg p-5">
                <ServiceInfoSection items={serviceInfo} />
              </div>
            </section>
          )}

          {/* Eligibility */}
          {eligibility.length > 0 && (
            <section>
              <h2 className="flex items-center gap-2 text-xl font-semibold text-foreground mb-4">
                <Users className="w-5 h-5 text-primary" />
                {t('section.whoCanApply')}
              </h2>
              <div className="bg-card border border-border rounded-lg p-5">
                <ServiceInfoSection items={eligibility} />
              </div>
            </section>
          )}

          {/* How to Apply - Steps */}
          {steps.length > 0 && (
            <section>
              <h2 className="flex items-center gap-2 text-xl font-semibold text-foreground mb-4">
                <ClipboardList className="w-5 h-5 text-primary" />
                {t('section.howToApply')}
              </h2>
              <div className="bg-card border border-border rounded-lg p-5">
                <StepsSection steps={steps} />
              </div>
            </section>
          )}

          {/* Fees */}
          {fees && fees.length > 0 && (
            <section>
              <h2 className="flex items-center gap-2 text-xl font-semibold text-foreground mb-4">
                <DollarSign className="w-5 h-5 text-primary" />
                {t('section.fees')}
              </h2>
              <div className="bg-card border border-border rounded-lg p-5">
                <FeesSection fees={fees} processingTimes={processingTime} />
              </div>
            </section>
          )}

          {/* Required Documents */}
          {documents.length > 0 && (
            <section>
              <h2 className="flex items-center gap-2 text-xl font-semibold text-foreground mb-4">
                <FileText className="w-5 h-5 text-primary" />
                {t('section.requiredDocuments')}
              </h2>
              <div className="bg-card border border-border rounded-lg p-5">
                <DocumentsSection items={documents} />
              </div>
            </section>
          )}

          {/* Processing Time */}
          {processingTime.length > 0 && (
            <section>
              <h2 className="flex items-center gap-2 text-xl font-semibold text-foreground mb-4">
                <Clock className="w-5 h-5 text-primary" />
                {t('section.processingTime')}
              </h2>
              <div className="bg-card border border-border rounded-lg p-5">
                <ServiceInfoSection items={processingTime} />
              </div>
            </section>
          )}

          {/* Portal Links */}
          {portalLinks.length > 0 && (
            <section>
              <h2 className="flex items-center gap-2 text-xl font-semibold text-foreground mb-4">
                <Link2 className="w-5 h-5 text-primary" />
                {t('section.quickLinks')}
              </h2>
              <div className="bg-card border border-border rounded-lg p-5">
                <ServiceInfoSection items={portalLinks} />
              </div>
            </section>
          )}

          {/* Official Links */}
          {guide.official_links && guide.official_links.length > 0 && (
            <section>
              <h2 className="flex items-center gap-2 text-xl font-semibold text-foreground mb-4">
                <Globe className="w-5 h-5 text-primary" />
                {t('section.officialLinks')}
              </h2>
              <OfficialLinksSection guide={guide} />
            </section>
          )}

          {/* Service Info - shown at end if we have structured content */}
          {hasStructuredContent && serviceInfo.length > 0 && (
            <section>
              <h2 className="flex items-center gap-2 text-xl font-semibold text-foreground mb-4">
                <FileText className="w-5 h-5 text-primary" />
                {t('section.additionalInfo')}
              </h2>
              <div className="bg-card border border-border rounded-lg p-5">
                <ServiceInfoSection items={serviceInfo} />
              </div>
            </section>
          )}

        </div>

        {/* Empty state */}
        {!hasStructuredContent && serviceInfo.length === 0 && (
          <div className="text-center py-12 bg-muted/30 rounded-lg">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-foreground mb-2">{t('empty.comingSoon')}</h3>
            <p className="text-muted-foreground">
              {t('empty.comingSoonDesc')}
            </p>
            {primaryPortal && (
              <Button asChild variant="outline" className="mt-4">
                <a href={primaryPortal} target="_blank" rel="noopener noreferrer">
                  {t('action.officialPortal')}
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
