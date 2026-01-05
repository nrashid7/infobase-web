import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, ExternalLink, Globe, Building2, Landmark, Users, Cpu, Scale, Banknote, GraduationCap, Heart, Leaf, Zap, Train, Wifi, MapPin, Briefcase, Users2, BarChart3, Shield, AlertTriangle, Anchor, List, ChevronRight, Filter, SortAsc, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { govDirectory, getTotalWebsites } from '@/data/govDirectory';
import { FaviconImage } from '@/components/FaviconImage';
import { getSiteSlug } from '@/lib/api/govSites';
import { useScrapeStatus } from '@/hooks/useScrapeStatus';
import { ScrapeStatusBadge } from '@/components/ScrapeStatusBadge';
import { SEO, generateWebsiteJsonLd } from '@/components/SEO';
import { DirectoryGridSkeleton } from '@/components/Skeleton';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Category icons mapping
const categoryIcons: Record<string, React.ElementType> = {
  'core-government': Landmark,
  'key-ministries': Building2,
  'public-services': Users,
  'e-governance': Cpu,
  'law-judiciary': Scale,
  'economic-institutions': Banknote,
  'education-research': GraduationCap,
  'health-services': Heart,
  'agriculture-environment': Leaf,
  'energy-utilities': Zap,
  'transport-infrastructure': Train,
  'communication-it': Wifi,
  'local-government': MapPin,
  'additional-ministries': Briefcase,
  'social-services': Users2,
  'planning-development': BarChart3,
  'security-defense': Shield,
  'regulatory-commissions': Scale,
  'disaster-emergency': AlertTriangle,
  'maritime-ports': Anchor,
  'administrative-directory': List,
};

type SortOption = 'default' | 'name-asc' | 'name-desc';
type FilterOption = 'all' | 'with-info' | 'pending';

export default function Directory() {
  const { language } = useLanguage();
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const { getStatus, isLoading: isLoadingStatus, stats } = useScrapeStatus();
  
  const totalWebsites = getTotalWebsites();

  const filteredCategories = useMemo(() => {
    let categories = govDirectory.map((category) => ({
      ...category,
      links: category.links.filter((link) => {
        // Search filter
        const query = search.toLowerCase();
        const matchesSearch = !query || 
          link.name.toLowerCase().includes(query) ||
          link.url.toLowerCase().includes(query) ||
          category.name.toLowerCase().includes(query) ||
          category.nameBn.includes(query);

        // Status filter
        const status = getStatus(link.url);
        const matchesFilter = 
          filterBy === 'all' ||
          (filterBy === 'with-info' && status === 'success') ||
          (filterBy === 'pending' && status !== 'success');

        return matchesSearch && matchesFilter;
      }),
    })).filter((category) => category.links.length > 0);

    // Sort links within categories
    if (sortBy !== 'default') {
      categories = categories.map((category) => ({
        ...category,
        links: [...category.links].sort((a, b) => {
          if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
          if (sortBy === 'name-desc') return b.name.localeCompare(a.name);
          return 0;
        }),
      }));
    }

    return categories;
  }, [search, sortBy, filterBy, getStatus]);

  const filteredCount = useMemo(() => {
    return filteredCategories.reduce((sum, cat) => sum + cat.links.length, 0);
  }, [filteredCategories]);

  return (
    <>
      <SEO
        title={language === 'bn' ? 'সরকারি পোর্টাল সংগ্রহ | INFOBASE' : 'Government Portal Directory | INFOBASE'}
        description={language === 'bn' 
          ? 'বাংলাদেশ সরকারের সব মন্ত্রণালয়, সংস্থা এবং পরিষেবার সরাসরি লিংক।'
          : 'Complete directory of Bangladesh government ministries, agencies, and services with direct links.'}
        jsonLd={generateWebsiteJsonLd()}
      />
      
      <div className="min-h-screen">
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background">
          {/* Decorative background pattern */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-20 left-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
            <div className="absolute top-40 right-1/4 w-96 h-96 bg-accent-gold/10 rounded-full blur-3xl" />
          </div>
          
          <div className="relative py-20 md:py-28 px-4 md:px-6">
            <div className="container max-w-5xl mx-auto">
              {/* Breadcrumbs */}
              <Breadcrumbs 
                items={[{ label: language === 'bn' ? 'ডিরেক্টরি' : 'Directory' }]} 
                className="mb-8 justify-center"
              />
              
              <div className="text-center">
                {/* Bangladesh Flag Icon */}
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-primary/10 mb-8 animate-fade-in">
                  <div className="w-14 h-10 rounded bg-[#006a4e] flex items-center justify-center">
                    <div className="w-7 h-7 rounded-full bg-[#f42a41]" />
                  </div>
                </div>
                
                <h1 className="text-foreground mb-4 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                  {language === 'bn' ? 'সরকারি পোর্টাল সংগ্রহ' : 'Official Portal Collection'}
                </h1>
              
              <p className="text-xl md:text-2xl text-primary font-medium mb-6 animate-fade-in" style={{ animationDelay: '0.15s' }}>
                {language === 'bn' ? 'সম্পূর্ণ রেফারেন্স গাইড' : 'Complete Reference Guide'}
              </p>
              
              <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: '0.2s' }}>
                {language === 'bn' 
                  ? 'সরকারি মন্ত্রণালয়, সংস্থা এবং পরিষেবার সরাসরি লিংক এক জায়গায়।'
                  : 'Direct links to government ministries, agencies, and services—organized for easy access.'}
              </p>

              {/* Stats Cards */}
              <div className="flex flex-wrap items-center justify-center gap-4 mb-10 animate-fade-in" style={{ animationDelay: '0.22s' }}>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-status-verified-bg border border-status-verified/20">
                  <CheckCircle className="w-4 h-4 text-status-verified" />
                  <span className="text-sm font-medium text-status-verified">
                    {stats.success} {language === 'bn' ? 'তথ্য আছে' : 'with info'}
                  </span>
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted border border-border">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">
                    {stats.pending + stats.failed} {language === 'bn' ? 'অপেক্ষমাণ' : 'pending'}
                  </span>
                </div>
              </div>

              {/* Search Bar */}
              <div className="max-w-2xl mx-auto mb-6 animate-fade-in" style={{ animationDelay: '0.25s' }}>
                <div className="relative">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder={language === 'bn' ? 'মন্ত্রণালয়, সংস্থা বা পরিষেবা খুঁজুন...' : 'Find a ministry, agency, or service...'}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-14 pr-5 py-7 text-lg rounded-2xl border-border/50 bg-background shadow-sm focus:shadow-md transition-shadow"
                  />
                </div>
              </div>

              {/* Filter & Sort Controls */}
              <div className="flex flex-wrap items-center justify-center gap-3 mb-8 animate-fade-in" style={{ animationDelay: '0.28s' }}>
                <Select value={filterBy} onValueChange={(v) => setFilterBy(v as FilterOption)}>
                  <SelectTrigger className="w-auto min-w-[160px] bg-background">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{language === 'bn' ? 'সব পোর্টাল' : 'All portals'}</SelectItem>
                    <SelectItem value="with-info">{language === 'bn' ? 'তথ্য আছে' : 'With info'}</SelectItem>
                    <SelectItem value="pending">{language === 'bn' ? 'তথ্য নেই' : 'No info yet'}</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                  <SelectTrigger className="w-auto min-w-[160px] bg-background">
                    <SortAsc className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">{language === 'bn' ? 'ডিফল্ট' : 'Default'}</SelectItem>
                    <SelectItem value="name-asc">{language === 'bn' ? 'নাম (A-Z)' : 'Name (A-Z)'}</SelectItem>
                    <SelectItem value="name-desc">{language === 'bn' ? 'নাম (Z-A)' : 'Name (Z-A)'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Count */}
              <p className="text-base md:text-lg text-muted-foreground animate-fade-in" style={{ animationDelay: '0.3s' }}>
                <span className="font-semibold text-foreground">{filteredCount}</span> {language === 'bn' ? 'টি পোর্টাল তালিকাভুক্ত' : 'portals listed'}
                {(search || filterBy !== 'all') && filteredCount !== totalWebsites && (
                  <span className="text-muted-foreground/70"> ({language === 'bn' ? 'মোট' : 'of'} {totalWebsites})</span>
                )}
              </p>
              </div>
            </div>
          </div>
        </div>

        {/* Categories Grid */}
        <div className="section-padding-sm">
          <div className="container max-w-7xl mx-auto">
            {isLoadingStatus ? (
              <DirectoryGridSkeleton count={6} />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {filteredCategories.map((category, index) => {
                  const IconComponent = categoryIcons[category.id] || Globe;
                  return (
                    <div 
                      key={category.id} 
                      className="modern-card p-6 md:p-8 animate-fade-in"
                      style={{ animationDelay: `${0.05 * index}s` }}
                    >
                      {/* Category Header */}
                      <div className="flex items-center gap-4 mb-5">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <IconComponent className="w-6 h-6 text-primary" />
                        </div>
                        <h2 className="text-lg md:text-xl font-semibold text-foreground">
                          {language === 'bn' ? category.nameBn : category.name}
                        </h2>
                      </div>

                      {/* Links List */}
                      <ul className="space-y-1">
                        {category.links.map((link) => {
                          const status = getStatus(link.url);
                          return (
                            <li key={link.url} className="group">
                              <div className="flex items-center gap-2">
                                <Link
                                  to={`/directory/${getSiteSlug(link.url)}`}
                                  className="flex items-center gap-3 py-2.5 px-3 -mx-3 rounded-xl hover:bg-accent/50 transition-colors flex-1 min-w-0"
                                >
                                  <div className="w-6 h-6 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 relative">
                                    <FaviconImage url={link.url} />
                                    {status && (
                                      <div className="absolute -top-1 -right-1">
                                        <ScrapeStatusBadge status={status} size="sm" />
                                      </div>
                                    )}
                                  </div>
                                  <span className="text-base text-foreground/80 group-hover:text-primary transition-colors truncate flex-1">
                                    {link.name}
                                  </span>
                                  <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                                </Link>
                                <a
                                  href={link.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-2 rounded-lg hover:bg-accent/50 transition-colors flex-shrink-0"
                                  title={language === 'bn' ? 'অফিসিয়াল সাইটে যান' : 'Visit official site'}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <ExternalLink className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors" />
                                </a>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  );
                })}
              </div>
            )}

            {filteredCategories.length === 0 && !isLoadingStatus && (
              <div className="text-center py-20 bg-muted/30 rounded-2xl">
                <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-6">
                  <Search className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="text-foreground mb-3">
                  {language === 'bn' ? 'কোন ফলাফল পাওয়া যায়নি' : 'No results found'}
                </h3>
                <p className="text-lg text-muted-foreground mb-6">
                  {language === 'bn' 
                    ? `"${search}" এর জন্য কোন ওয়েবসাইট পাওয়া যায়নি।` 
                    : `No websites found for "${search}".`}
                </p>
                <Button variant="outline" onClick={() => { setSearch(''); setFilterBy('all'); }}>
                  {language === 'bn' ? 'ফিল্টার রিসেট করুন' : 'Reset filters'}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Footer Section */}
        <div className="py-16 md:py-20 px-4 md:px-6 border-t border-border/50 bg-muted/20">
          <div className="container max-w-4xl mx-auto">
            {/* Action Buttons */}
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <a
                href="mailto:contact@infobase.gov.bd?subject=Report%20Broken%20Link"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-border bg-background hover:bg-accent/50 text-base font-medium text-foreground transition-colors"
              >
                {language === 'bn' ? 'ভাঙা লিংক রিপোর্ট করুন' : 'Report Broken Link'}
              </a>
              <a
                href="mailto:contact@infobase.gov.bd?subject=Suggest%20New%20Website"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-border bg-background hover:bg-accent/50 text-base font-medium text-foreground transition-colors"
              >
                {language === 'bn' ? 'নতুন ওয়েবসাইট সাজেস্ট করুন' : 'Suggest New Website'}
              </a>
            </div>

            {/* Disclaimer */}
            <div className="text-center text-base md:text-lg text-muted-foreground max-w-3xl mx-auto mb-6">
              <p>
                {language === 'bn' 
                  ? 'এটি বাংলাদেশ সরকারের ওয়েবসাইটগুলির একটি অনানুষ্ঠানিক ডিরেক্টরি। সমস্ত লিংক আপনার সুবিধার জন্য নতুন ট্যাবে খোলে। আপনি যদি কোন ভাঙা লিংক খুঁজে পান বা এই ডিরেক্টরিতে সংযোজন সুপারিশ করতে চান, অনুগ্রহ করে আমাদের জানান।'
                  : 'This is an unofficial directory of government websites of Bangladesh. All links open in a new tab for your convenience. If you find any broken links or would like to suggest additions to this directory, please let us know.'}
              </p>
            </div>

            {/* Last Updated */}
            <p className="text-center text-sm text-primary font-medium">
              {language === 'bn' ? 'সর্বশেষ আপডেট: ২ জানুয়ারি ২০২৬' : 'Last updated: 2nd Jan 2026'}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
