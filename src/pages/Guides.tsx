import { useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { BookOpen, Search, ArrowRight } from 'lucide-react';
import { listGuides, listAgencies, getGuideById } from '@/lib/guidesStore';
import { useLanguage } from '@/lib/LanguageContext';
import { Input } from '@/components/ui/input';
import { FaviconImage, getAgencyDomain } from '@/components/FaviconImage';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function Guides() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [agencyFilter, setAgencyFilter] = useState(searchParams.get('agency') || 'all');
  const { t, language } = useLanguage();

  const agencies = listAgencies();

  const guides = useMemo(() => {
    return listGuides({
      search: search || undefined,
      agency: agencyFilter !== 'all' ? agencyFilter : undefined,
    });
  }, [search, agencyFilter]);

  const updateFilter = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value === 'all' || value === '') {
      newParams.delete(key);
    } else {
      newParams.set(key, value);
    }
    setSearchParams(newParams);
  };

  return (
    <div className="py-10 px-4">
      <div className="container max-w-6xl">
        {/* Breadcrumbs */}
        <Breadcrumbs 
          items={[{ label: language === 'bn' ? 'গাইড' : 'Guides' }]} 
          className="mb-6"
        />
        
        {/* Header */}
        <header className="mb-10 text-center md:text-left">
          <h1 className="text-3xl font-bold text-foreground mb-3">
            {t('guides.title')}
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl">
            {t('guides.subtitle')}
          </p>
        </header>

        {/* Search and Filter */}
        <div className="bg-card border border-border rounded-xl p-4 md:p-5 mb-8 shadow-sm">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  updateFilter('search', e.target.value);
                }}
                placeholder={t('guides.searchPlaceholder')}
                className="pl-10 h-11"
              />
            </div>

            <Select value={agencyFilter} onValueChange={(v) => {
              setAgencyFilter(v);
              updateFilter('agency', v);
            }}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder={language === 'bn' ? 'সব সংস্থা' : 'All agencies'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{language === 'bn' ? 'সব সংস্থা' : 'All agencies'}</SelectItem>
                {agencies.map((agency) => (
                  <SelectItem key={agency.id} value={agency.id}>
                    {agency.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results count */}
        <p className="text-sm text-muted-foreground mb-6">
          {language === 'bn' 
            ? `${guides.length}টি গাইড পাওয়া গেছে`
            : `${guides.length} guide${guides.length !== 1 ? 's' : ''} found`}
        </p>

        {/* Guides Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {guides.map((guide, idx) => (
            <Link
              key={guide.guide_id}
              to={`/guides/${guide.guide_id}`}
              className="modern-card p-5 group animate-fade-in"
              style={{ animationDelay: `${idx * 0.05}s` }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  {(() => {
                    const fullGuide = getGuideById(guide.guide_id);
                    const domain = getAgencyDomain(fullGuide?.official_links);
                    return domain ? (
                      <FaviconImage url={`https://${domain}`} className="w-4 h-4" fallbackClassName="w-3.5 h-3.5 text-primary" />
                    ) : (
                      <BookOpen className="w-3.5 h-3.5 text-primary" />
                    );
                  })()}
                </div>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide truncate">
                  {guide.agency_name}
                </span>
              </div>

              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors mb-3 leading-snug">
                {guide.title}
              </h3>
              
              <p className="text-sm text-muted-foreground mb-4">
                {guide.step_count > 0 
                  ? `${guide.step_count} ${language === 'bn' ? 'ধাপ' : 'steps'}` 
                  : language === 'bn' ? 'সেবার তথ্য' : 'Service information'} 
                {guide.citation_count > 0 && ` • ${guide.citation_count} ${language === 'bn' ? 'সাইটেশন' : 'citations'}`}
              </p>

              <div className="flex items-center justify-between">
                <span className="text-xs text-primary font-medium">
                  {t('action.viewDetails')}
                </span>
                <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              </div>
            </Link>
          ))}
        </div>

        {guides.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-5">
              <BookOpen className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-foreground text-lg mb-2">{t('search.noResults')}</h3>
            <p className="text-muted-foreground">
              {language === 'bn' 
                ? 'আপনার অনুসন্ধান বা ফিল্টার সামঞ্জস্য করে দেখুন।'
                : 'Try adjusting your search or filters.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}