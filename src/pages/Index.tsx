import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, FileCheck, Clock, Shield, BookOpen, CreditCard, Car, Baby, Plane, Search, MousePointerClick, Sparkles } from 'lucide-react';
import { getGuideStats, listGuides } from '@/lib/guidesStore';
import { useLanguage } from '@/lib/LanguageContext';
import { GlobalSearch } from '@/components/GlobalSearch';
import { Button } from '@/components/ui/button';

// Category chips for quick navigation with icons
const categoryChips = [
  { label: 'Passport', labelBn: 'পাসপোর্ট', search: 'passport', icon: BookOpen },
  { label: 'NID', labelBn: 'এনআইডি', search: 'nid', icon: CreditCard },
  { label: 'Driving License', labelBn: 'ড্রাইভিং লাইসেন্স', search: 'driving', icon: Car },
  { label: 'Birth Certificate', labelBn: 'জন্ম সনদ', search: 'birth', icon: Baby },
  { label: 'Visa', labelBn: 'ভিসা', search: 'visa', icon: Plane },
  { label: 'TIN', labelBn: 'টিআইএন', search: 'tin', icon: FileCheck },
  { label: 'Land Records', labelBn: 'ভূমি রেকর্ড', search: 'land', icon: FileCheck },
];

// How it works steps
const howItWorksSteps = [
  {
    icon: Search,
    titleEn: 'Search or Browse',
    titleBn: 'অনুসন্ধান করুন',
    descEn: 'Find the service you need using AI search or browse categories',
    descBn: 'AI সার্চ বা ক্যাটাগরি ব্রাউজ করে আপনার প্রয়োজনীয় সেবা খুঁজুন',
  },
  {
    icon: FileCheck,
    titleEn: 'Get Requirements',
    titleBn: 'প্রয়োজনীয়তা দেখুন',
    descEn: 'See exact documents, fees, and steps verified from official sources',
    descBn: 'অফিসিয়াল সোর্স থেকে যাচাইকৃত কাগজপত্র, ফি এবং ধাপ দেখুন',
  },
  {
    icon: MousePointerClick,
    titleEn: 'Apply Confidently',
    titleBn: 'আবেদন করুন',
    descEn: 'Direct links to official portals—no middlemen, no guesswork',
    descBn: 'অফিসিয়াল পোর্টালে সরাসরি লিংক—কোনো মধ্যস্থতাকারী নেই',
  },
];

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
      <section className="relative py-16 md:py-24 px-4 overflow-hidden">
        {/* Mesh gradient background */}
        <div className="absolute inset-0 mesh-bg opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background" />
        
        <div className="container max-w-4xl relative">
          {/* Time-based greeting */}
          <div className="text-center mb-4 animate-fade-in">
            <p className="text-sm text-muted-foreground inline-flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse" />
              {getGreeting()} — {language === 'bn' ? 'আজ আপনাকে কীভাবে সাহায্য করতে পারি?' : 'How can we help you today?'}
            </p>
          </div>

          {/* Trust badge */}
          <div className="flex justify-center mb-8 animate-fade-in" style={{ animationDelay: '0.05s' }}>
            <div className="trust-badge">
              <Shield className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'অনানুষ্ঠানিক গাইড • যাচাইকৃত সোর্স' : 'Unofficial Guide • Verified Sources'}</span>
            </div>
          </div>

          {/* Main heading */}
          <div className="text-center mb-10 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4 tracking-tight leading-tight">
              {t('home.title')}
            </h1>
            <p className="text-lg md:text-xl text-primary font-medium mb-4">
              {t('home.subtitle')}
            </p>
            <p className="text-muted-foreground max-w-2xl mx-auto text-base md:text-lg leading-relaxed">
              {t('home.description')}
            </p>
          </div>

          {/* AI Search Bar */}
          <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <GlobalSearch className="max-w-xl mx-auto mb-8" />
          </div>

          {/* Stats inline */}
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8 text-sm mb-8 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border">
              <span className="font-bold text-lg text-primary">{stats.guides}</span>
              <span className="text-muted-foreground">{language === 'bn' ? 'গাইড' : 'guides'}</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border">
              <span className="font-bold text-lg text-primary">{stats.agencies}</span>
              <span className="text-muted-foreground">{language === 'bn' ? 'সংস্থা' : 'agencies'}</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border">
              <span className="font-bold text-lg text-primary">{stats.totalCitations}</span>
              <span className="text-muted-foreground">{language === 'bn' ? 'সাইটেশন' : 'citations'}</span>
            </div>
          </div>

          {/* Quick Access Categories */}
          <div className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-4 text-center">
              {language === 'bn' ? 'জনপ্রিয় সেবা' : 'Popular Services'}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 max-w-2xl mx-auto">
              {categoryChips.map((chip) => (
                <Link
                  key={chip.label}
                  to={`/guides?search=${chip.search}`}
                  className="pill-button inline-flex items-center gap-1.5"
                >
                  <chip.icon className="w-3.5 h-3.5" />
                  {language === 'bn' ? chip.labelBn : chip.label}
                </Link>
              ))}
              <Link
                to="/guides"
                className="pill-button inline-flex items-center gap-1.5 bg-primary/10 hover:bg-primary/20 text-primary border-primary/20"
              >
                {language === 'bn' ? 'সব দেখুন' : 'View All'}
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - New Section */}
      <section className="py-16 px-4 border-y border-border bg-muted/20">
        <div className="container max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              {language === 'bn' ? 'কিভাবে কাজ করে' : 'How It Works'}
            </h2>
            <p className="text-muted-foreground">
              {language === 'bn' ? 'তিনটি সহজ ধাপে আপনার প্রয়োজনীয় তথ্য পান' : 'Get the information you need in three simple steps'}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            {howItWorksSteps.map((step, idx) => (
              <div 
                key={idx} 
                className="relative glass-card p-6 text-center animate-fade-in group hover:border-primary/30 transition-all"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                {/* Step number */}
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="number-badge shadow-lg">
                    {idx + 1}
                  </div>
                </div>
                
                {/* Icon */}
                <div className="icon-container mx-auto mt-4 mb-4 group-hover:scale-110 transition-transform">
                  <step.icon className="w-6 h-6" />
                </div>
                
                {/* Content */}
                <h3 className="font-semibold text-foreground mb-2">
                  {language === 'bn' ? step.titleBn : step.titleEn}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {language === 'bn' ? step.descBn : step.descEn}
                </p>

                {/* Connector line on desktop */}
                {idx < howItWorksSteps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 md:-right-6 w-8 md:w-12 h-0.5 bg-border" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Guides */}
      <section className="py-16 px-4">
        <div className="container max-w-5xl">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                {t('home.popular')}
              </h2>
              <p className="text-muted-foreground">
                {language === 'bn' ? 'সবচেয়ে বেশি দেখা সেবা গাইড' : 'Most viewed service guides'}
              </p>
            </div>
            <Button asChild variant="outline" size="sm" className="hidden md:inline-flex group">
              <Link to="/guides">
                {language === 'bn' ? 'সব দেখুন' : 'View all'}
                <ArrowRight className="w-3.5 h-3.5 ml-1.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </Button>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            {guides.slice(0, 4).map((guide, idx) => (
              <Link
                key={guide.guide_id}
                to={`/guides/${guide.guide_id}`}
                className="modern-card p-6 group relative overflow-hidden"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                {/* Rank badge */}
                <div className="absolute top-4 right-4">
                  <span className="text-4xl font-bold text-muted/30 group-hover:text-primary/20 transition-colors">
                    #{idx + 1}
                  </span>
                </div>

                <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide font-medium">
                  {guide.agency_name}
                </p>
                <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors mb-3 pr-12">
                  {guide.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {guide.step_count > 0 
                    ? `${guide.step_count} ${language === 'bn' ? 'ধাপ' : 'steps'}` 
                    : language === 'bn' ? 'সেবার তথ্য' : 'Service information'}
                  {guide.citation_count > 0 && ` • ${guide.citation_count} ${language === 'bn' ? 'সাইটেশন' : 'citations'}`}
                </p>
                <span className="text-sm text-primary font-medium inline-flex items-center gap-1.5 group-hover:gap-2 transition-all">
                  {t('action.viewDetails')}
                  <ArrowRight className="w-4 h-4" />
                </span>
              </Link>
            ))}
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
      <section className="py-16 px-4 bg-muted/30 border-y border-border">
        <div className="container max-w-5xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              {language === 'bn' ? 'কেন আমাদের বিশ্বাস করবেন' : 'Why trust us'}
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              {language === 'bn' ? 'কেন INFOBASE?' : 'Why INFOBASE?'}
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="feature-card group">
              <div className="icon-container mx-auto mb-5 group-hover:scale-110 transition-transform">
                <FileCheck className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-foreground mb-3 text-lg">
                {t('home.feature1.title')}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t('home.feature1.desc')}
              </p>
            </div>

            {/* Feature 2 */}
            <div className="feature-card group">
              <div className="icon-container mx-auto mb-5 group-hover:scale-110 transition-transform">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-foreground mb-3 text-lg">
                {t('home.feature2.title')}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t('home.feature2.desc')}
              </p>
            </div>

            {/* Feature 3 */}
            <div className="feature-card group">
              <div className="icon-container mx-auto mb-5 group-hover:scale-110 transition-transform">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-foreground mb-3 text-lg">
                {t('home.feature3.title')}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t('home.feature3.desc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="py-10 px-4">
        <div className="container max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 text-muted-foreground text-sm">
            <Shield className="w-4 h-4 flex-shrink-0" />
            <span>
              {language === 'bn' 
                ? <>এটি একটি অনানুষ্ঠানিক গাইড। পদক্ষেপ নেওয়ার আগে সর্বদা <Link to="/about" className="text-primary hover:underline font-medium">অফিসিয়াল সোর্সে</Link> যাচাই করুন।</>
                : <>This is an unofficial guide. Always verify on{' '}<Link to="/about" className="text-primary hover:underline font-medium">official sources</Link>{' '}before taking action.</>}
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
