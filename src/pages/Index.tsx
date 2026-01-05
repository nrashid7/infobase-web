import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, FileCheck, Clock, Shield, BookOpen, CreditCard, Car, Baby, Plane, Search, MousePointerClick, Sparkles, Zap } from 'lucide-react';
import { getGuideStats, listGuides, getGuideById } from '@/lib/guidesStore';
import { useLanguage } from '@/lib/LanguageContext';
import { GlobalSearch } from '@/components/GlobalSearch';
import { Button } from '@/components/ui/button';
import { FaviconImage, getAgencyDomain } from '@/components/FaviconImage';

// Category chips for quick navigation with icons and agency domains
const categoryChips = [{
  label: 'Passport',
  labelBn: 'পাসপোর্ট',
  search: 'passport',
  icon: BookOpen,
  domain: 'epassport.gov.bd'
}, {
  label: 'NID',
  labelBn: 'এনআইডি',
  search: 'nid',
  icon: CreditCard,
  domain: 'services.nidw.gov.bd'
}, {
  label: 'Driving License',
  labelBn: 'ড্রাইভিং লাইসেন্স',
  search: 'driving',
  icon: Car,
  domain: 'brta.gov.bd'
}, {
  label: 'Birth Certificate',
  labelBn: 'জন্ম সনদ',
  search: 'birth',
  icon: Baby,
  domain: 'bdris.gov.bd'
}, {
  label: 'Visa',
  labelBn: 'ভিসা',
  search: 'visa',
  icon: Plane,
  domain: 'mofa.gov.bd'
}, {
  label: 'TIN',
  labelBn: 'টিআইএন',
  search: 'tin',
  icon: FileCheck,
  domain: 'nbr.gov.bd'
}, {
  label: 'Land Records',
  labelBn: 'ভূমি রেকর্ড',
  search: 'land',
  icon: FileCheck,
  domain: 'land.gov.bd'
}];

// How it works steps
const howItWorksSteps = [{
  icon: Search,
  titleEn: 'Search or Browse',
  titleBn: 'অনুসন্ধান করুন',
  descEn: 'Find the service you need using AI search or browse categories',
  descBn: 'AI সার্চ বা ক্যাটাগরি ব্রাউজ করে আপনার প্রয়োজনীয় সেবা খুঁজুন'
}, {
  icon: FileCheck,
  titleEn: 'Get Requirements',
  titleBn: 'প্রয়োজনীয়তা দেখুন',
  descEn: 'See exact documents, fees, and steps verified from official sources',
  descBn: 'অফিসিয়াল সোর্স থেকে যাচাইকৃত কাগজপত্র, ফি এবং ধাপ দেখুন'
}, {
  icon: MousePointerClick,
  titleEn: 'Apply Confidently',
  titleBn: 'আবেদন করুন',
  descEn: 'Direct links to official portals—no middlemen, no guesswork',
  descBn: 'অফিসিয়াল পোর্টালে সরাসরি লিংক—কোনো মধ্যস্থতাকারী নেই'
}];

export default function Index() {
  const stats = getGuideStats();
  const guides = listGuides();
  const { t, language } = useLanguage();
  
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return language === 'bn' ? 'শুভ সকাল' : 'Good morning';
    if (hour < 17) return language === 'bn' ? 'শুভ অপরাহ্ন' : 'Good afternoon';
    return language === 'bn' ? 'শুভ সন্ধ্যা' : 'Good evening';
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 lg:py-40 px-4 md:px-6 overflow-hidden">
        {/* Enhanced background with gradient orbs */}
        <div className="absolute inset-0 mesh-bg" />
        <div className="hero-orb hero-orb-primary w-[600px] h-[600px] -top-40 left-1/4 animate-float" />
        <div className="hero-orb hero-orb-gold w-[400px] h-[400px] top-20 right-10 animate-float animation-delay-200" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/60 to-background" />
        
        <div className="container max-w-5xl relative">
          {/* Time-based greeting */}
          <div className="text-center mb-6 opacity-0 animate-fade-in">
            <p className="text-base md:text-lg text-muted-foreground inline-flex items-center gap-3">
              {getGreeting()} — {language === 'bn' ? 'আজ আপনাকে কীভাবে সাহায্য করতে পারি?' : 'How can we help you today?'}
            </p>
          </div>

          {/* Trust badge */}
          <div className="flex justify-center mb-10 opacity-0 animate-fade-in animation-delay-100">
            <div className="trust-badge">
              <Shield className="w-4 h-4" />
              <span>{language === 'bn' ? 'অনানুষ্ঠানিক গাইড • যাচাইকৃত সোর্স' : 'Unofficial Guide • Verified Sources'}</span>
            </div>
          </div>

          {/* Main heading with gradient text */}
          <div className="text-center mb-12 opacity-0 animate-fade-in animation-delay-200">
            <h1 className="text-foreground mb-6 text-balance">
              <span className="gradient-text">{language === 'bn' ? 'সরকারি সেবা' : 'Government Services'}</span>
              <br />
              <span>{language === 'bn' ? 'আত্মবিশ্বাসের সাথে নেভিগেট করুন' : 'Navigate with Confidence'}</span>
            </h1>
            <p className="text-xl md:text-2xl text-primary font-medium mb-6 font-display">
              {t('home.subtitle')}
            </p>
          </div>

          {/* AI Search Bar */}
          <div className="opacity-0 animate-fade-in animation-delay-300">
            <GlobalSearch className="max-w-2xl mx-auto mb-12" />
          </div>

          {/* Stats with enhanced styling */}
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 mb-14 opacity-0 animate-fade-in animation-delay-400">
            <div className="stat-card group">
              <span className="font-display font-bold text-3xl text-primary group-hover:scale-110 transition-transform">{stats.guides}</span>
              <span className="text-muted-foreground text-base">{language === 'bn' ? 'গাইড' : 'guides'}</span>
            </div>
            <div className="stat-card group">
              <span className="font-display font-bold text-3xl text-primary group-hover:scale-110 transition-transform">{stats.agencies}</span>
              <span className="text-muted-foreground text-base">{language === 'bn' ? 'সংস্থা' : 'agencies'}</span>
            </div>
            <div className="stat-card group">
              <span className="font-display font-bold text-3xl text-primary group-hover:scale-110 transition-transform">{stats.totalCitations}</span>
              <span className="text-muted-foreground text-base">{language === 'bn' ? 'সাইটেশন' : 'citations'}</span>
            </div>
          </div>

          {/* Quick Access Categories */}
          <div className="opacity-0 animate-fade-in animation-delay-500">
            <p className="text-sm md:text-base text-muted-foreground uppercase tracking-wider font-medium mb-6 text-center">
              {language === 'bn' ? 'জনপ্রিয় সেবা' : 'Popular Services'}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 max-w-3xl mx-auto">
              {categoryChips.map((chip, idx) => (
                <Link 
                  key={chip.label} 
                  to={`/guides?search=${chip.search}`} 
                  className="pill-button inline-flex items-center gap-2"
                  style={{ animationDelay: `${0.5 + idx * 0.05}s` }}
                >
                  <FaviconImage 
                    url={`https://${chip.domain}`} 
                    className="w-4 h-4" 
                    fallbackClassName="w-4 h-4"
                  />
                  {language === 'bn' ? chip.labelBn : chip.label}
                </Link>
              ))}
              <Link 
                to="/guides" 
                className="pill-button inline-flex items-center gap-2 !bg-primary/10 hover:!bg-primary/20 !text-primary !border-primary/25"
              >
                {language === 'bn' ? 'সব দেখুন' : 'View All'}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="section-padding border-y border-border bg-muted/30">
        <div className="container max-w-6xl">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Zap className="w-4 h-4" />
              {language === 'bn' ? 'সহজ প্রক্রিয়া' : 'Simple Process'}
            </div>
            <h2 className="text-foreground mb-4 text-balance">
              {language === 'bn' ? 'কিভাবে কাজ করে' : 'How It Works'}
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              {language === 'bn' ? 'তিনটি সহজ ধাপে আপনার প্রয়োজনীয় তথ্য পান' : 'Get the information you need in three simple steps'}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            {howItWorksSteps.map((step, idx) => (
              <div 
                key={idx} 
                className="relative glass-card p-8 md:p-10 text-center group hover:border-primary/30 transition-all duration-300"
              >
                {/* Step number */}
                <div className="absolute -top-5 left-1/2 -translate-x-1/2">
                  <div className="number-badge">
                    {idx + 1}
                  </div>
                </div>
                
                {/* Icon */}
                <div className="icon-container mx-auto mt-4 mb-6 group-hover:scale-110 transition-transform duration-300">
                  <step.icon className="w-7 h-7" />
                </div>
                
                {/* Content */}
                <h3 className="text-foreground mb-3">
                  {language === 'bn' ? step.titleBn : step.titleEn}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {language === 'bn' ? step.descBn : step.descEn}
                </p>

                {/* Connector line on desktop */}
                {idx < howItWorksSteps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-6 lg:-right-8 w-12 lg:w-16">
                    <div className="h-0.5 bg-gradient-to-r from-border to-primary/30" />
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary/40" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Guides */}
      <section className="section-padding">
        <div className="container max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-foreground mb-3">
              {t('home.popular')}
            </h2>
            <p className="text-lg text-muted-foreground">
              {language === 'bn' ? 'সবচেয়ে বেশি দেখা সেবা গাইড' : 'Most viewed service guides'}
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6 mb-10">
            {guides.slice(0, 4).map((guide, idx) => {
              const fullGuide = getGuideById(guide.guide_id);
              const agencyDomain = fullGuide ? getAgencyDomain(fullGuide.official_links) : null;
              
              return (
                <Link 
                  key={guide.guide_id} 
                  to={`/guides/${guide.guide_id}`} 
                  className="modern-card p-8 group relative overflow-hidden"
                >
                  {/* Rank badge */}
                  <div className="absolute top-6 right-6">
                    <span className="font-display text-5xl font-bold text-muted/15 group-hover:text-primary/15 transition-colors duration-300">
                      #{idx + 1}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    {agencyDomain && (
                      <FaviconImage 
                        url={`https://${agencyDomain}`} 
                        className="w-4 h-4 flex-shrink-0" 
                      />
                    )}
                    <p className="text-sm text-muted-foreground uppercase tracking-wide font-medium">
                      {guide.agency_name}
                    </p>
                  </div>
                  <h3 className="text-foreground group-hover:text-primary transition-colors duration-300 mb-4 pr-16">
                    {guide.title}
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    {guide.step_count > 0 ? `${guide.step_count} ${language === 'bn' ? 'ধাপ' : 'steps'}` : language === 'bn' ? 'সেবার তথ্য' : 'Service information'}
                    {guide.citation_count > 0 && ` • ${guide.citation_count} ${language === 'bn' ? 'সাইটেশন' : 'citations'}`}
                  </p>
                  <span className="text-base text-primary font-medium inline-flex items-center gap-2 group-hover:gap-3 transition-all duration-300">
                    {t('action.viewDetails')}
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                  </span>
                </Link>
              );
            })}
          </div>

          <div className="text-center md:hidden">
            <Button asChild variant="outline" size="lg" className="group">
              <Link to="/guides">
                {t('home.viewAll')}
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Why Use INFOBASE */}
      <section className="section-padding bg-muted/20 border-y border-border relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute inset-0 opacity-50">
          <div className="hero-orb hero-orb-primary w-[500px] h-[500px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
        
        <div className="container max-w-6xl relative">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              {language === 'bn' ? 'কেন আমাদের বিশ্বাস করবেন' : 'Why trust us'}
            </div>
            <h2 className="text-foreground text-balance">
              {language === 'bn' ? 'কেন INFOBASE?' : 'Why INFOBASE?'}
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="feature-card group">
              <div className="icon-container mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <FileCheck className="w-7 h-7" />
              </div>
              <h3 className="text-foreground mb-4">
                {t('home.feature1.title')}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {t('home.feature1.desc')}
              </p>
            </div>

            {/* Feature 2 */}
            <div className="feature-card group">
              <div className="icon-container mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-foreground mb-4">
                {t('home.feature2.title')}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {t('home.feature2.desc')}
              </p>
            </div>

            {/* Feature 3 */}
            <div className="feature-card group">
              <div className="icon-container mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <Clock className="w-7 h-7" />
              </div>
              <h3 className="text-foreground mb-4">
                {t('home.feature3.title')}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {t('home.feature3.desc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="py-12 md:py-16 px-4 md:px-6">
        <div className="container max-w-3xl text-center">
          <div className="inline-flex items-center gap-3 text-muted-foreground text-base md:text-lg">
            <Shield className="w-5 h-5 flex-shrink-0" />
            <span>
              {language === 'bn' ? (
                <>
                  এটি একটি অনানুষ্ঠানিক গাইড। পদক্ষেপ নেওয়ার আগে সর্বদা{' '}
                  <Link to="/about" className="text-primary hover:underline font-medium">
                    অফিসিয়াল সোর্সে
                  </Link>{' '}
                  যাচাই করুন।
                </>
              ) : (
                <>
                  This is an unofficial guide. Always verify on{' '}
                  <Link to="/about" className="text-primary hover:underline font-medium">
                    official sources
                  </Link>{' '}
                  before taking action.
                </>
              )}
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}