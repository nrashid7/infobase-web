import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, FileCheck, Clock, Shield, BookOpen, CreditCard, Car, Baby, Plane, Search, MousePointerClick, Sparkles, Zap, Building2, Globe } from 'lucide-react';
import { getGuideStats, listGuides, getGuideById } from '@/lib/guidesStore';
import { useLanguage } from '@/lib/LanguageContext';
import { GlobalSearch } from '@/components/GlobalSearch';
import { Button } from '@/components/ui/button';
import { FaviconImage, getAgencyDomain } from '@/components/FaviconImage';
import { SEO, generateWebsiteJsonLd, generateOrganizationJsonLd } from '@/components/SEO';
import { motion, useInView } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';

// Inline slug helper to avoid importing the heavy govSites module
function getSiteSlug(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '').replace(/\./g, '-');
  } catch {
    return encodeURIComponent(url);
  }
}

// Inline featured sites to avoid importing the entire 887-line govDirectory on the homepage
const FEATURED_SITES = [
  { name: "President's Office (Bangabhaban)", url: 'https://bangabhaban.gov.bd/', category: 'Core Government', categoryBn: 'মূল সরকার' },
  { name: "Chief Adviser's Office", url: 'https://cao.gov.bd/', category: 'Core Government', categoryBn: 'মূল সরকার' },
  { name: 'Ministry of Finance', url: 'https://mof.gov.bd/', category: 'Ministry of Finance', categoryBn: 'অর্থ মন্ত্রণালয়' },
  { name: 'Finance Division', url: 'https://fid.gov.bd/', category: 'Ministry of Finance', categoryBn: 'অর্থ মন্ত্রণালয়' },
];

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

// Counter animation hook
function useCounter(target: number, duration = 1500) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });

  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [inView, target, duration]);

  return { count, ref };
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export default function Index() {
  const stats = getGuideStats();
  const guides = listGuides();
  const { t, language } = useLanguage();
  const featuredSites = FEATURED_SITES;

  // Defer scrape status fetch so it doesn't block LCP
  const [scrapeSuccessCount, setScrapeSuccessCount] = useState(0);
  useEffect(() => {
    import('@/hooks/useScrapeStatus').then(({ fetchScrapeStats }) =>
      fetchScrapeStats().then(s => setScrapeSuccessCount(s.success))
    );
  }, []);
  
  const guidesCounter = useCounter(stats.guides);
  const portalsCounter = useCounter(728);
  const detailsCounter = useCounter(scrapeSuccessCount);
  const citationsCounter = useCounter(stats.totalCitations);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return language === 'bn' ? 'শুভ সকাল' : 'Good morning';
    if (hour < 17) return language === 'bn' ? 'শুভ অপরাহ্ন' : 'Good afternoon';
    return language === 'bn' ? 'শুভ সন্ধ্যা' : 'Good evening';
  };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      generateWebsiteJsonLd(),
      generateOrganizationJsonLd(),
    ],
  };

  return (
    <>
      <SEO
        title="INFOBASE - Bangladesh Government Services Guide"
        description="Navigate Bangladesh government services with confidence. Clear, verified guides for passport, NID, driving license, birth certificate, visa and more."
        jsonLd={jsonLd}
      />
      
      <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 lg:py-40 px-4 md:px-6 overflow-hidden">
        {/* Dot grid pattern overlay */}
        <div className="absolute inset-0 dot-grid" />
        <div className="absolute inset-0 mesh-bg" />
        
        {/* Animated orbs with framer-motion */}
        <motion.div
          className="hero-orb hero-orb-primary w-[600px] h-[600px] -top-40 left-1/4"
          animate={{ y: [0, -20, 0], x: [0, 10, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="hero-orb hero-orb-gold w-[400px] h-[400px] top-20 right-10"
          animate={{ y: [0, 15, 0], x: [0, -10, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        />
        
        {/* Decorative rotating rings */}
        <div className="absolute pointer-events-none" style={{ top: 'calc(50% - 250px)', left: 'calc(50% - 250px)', width: '500px', height: '500px' }}>
          <div 
            className="w-full h-full md:w-[700px] md:h-[700px] rounded-full border border-primary/[0.06] dark:border-primary/[0.1]"
            style={{ animation: 'rotate-slow 60s linear infinite', contain: 'layout style' }}
          />
        </div>
        <div className="absolute pointer-events-none" style={{ top: 'calc(50% - 200px)', left: 'calc(50% - 200px)', width: '400px', height: '400px' }}>
          <div 
            className="w-full h-full md:w-[550px] md:h-[550px] rounded-full border border-dashed border-primary/[0.04] dark:border-primary/[0.08]"
            style={{ animation: 'rotate-slow 45s linear infinite reverse', contain: 'layout style' }}
          />
        </div>

        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/60 to-background" />
        
        <div className="container max-w-5xl relative">
          {/* Time-based greeting */}
          <motion.div className="text-center mb-6" variants={fadeUp} initial="hidden" animate="visible" custom={0}>
            <p className="text-base md:text-lg text-muted-foreground inline-flex items-center gap-3">
              {getGreeting()} — {language === 'bn' ? 'আজ আপনাকে কীভাবে সাহায্য করতে পারি?' : 'How can we help you today?'}
            </p>
          </motion.div>

          {/* Trust badge */}
          <motion.div className="flex justify-center mb-10" variants={fadeUp} initial="hidden" animate="visible" custom={1}>
            <div className="trust-badge">
              <Shield className="w-4 h-4" />
              <span>{language === 'bn' ? 'অনানুষ্ঠানিক গাইড • যাচাইকৃত সোর্স' : 'Unofficial Guide • Verified Sources'}</span>
            </div>
          </motion.div>

          {/* Main heading */}
          <motion.div className="text-center mb-12" variants={fadeUp} initial="hidden" animate="visible" custom={2}>
            <h1 className="text-foreground mb-6 text-balance">
              <span className="gradient-text text-5xl md:text-6xl lg:text-7xl font-extrabold">{language === 'bn' ? 'সকল সরকারি সেবা' : 'Every Government Service'}</span>
              <br />
              <span className="font-light text-3xl md:text-4xl lg:text-5xl text-muted-foreground mt-2 block">{language === 'bn' ? 'এক জায়গায়' : 'One Place'}</span>
            </h1>
            <motion.p 
              className="text-xl md:text-2xl text-primary font-medium mb-6 font-display"
              initial={{ opacity: 0, filter: 'blur(8px)' }}
              animate={{ opacity: 1, filter: 'blur(0px)' }}
              transition={{ delay: 0.6, duration: 0.8 }}
            >
              {t('home.subtitle')}
            </motion.p>
          </motion.div>

          {/* AI Search Bar with glow */}
          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={3} className="search-glow rounded-2xl max-w-2xl mx-auto mb-12">
            <GlobalSearch className="max-w-2xl mx-auto" />
          </motion.div>

          {/* Stats with counter animation */}
          <motion.div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 mb-14" variants={fadeUp} initial="hidden" animate="visible" custom={4}>
            <div className="stat-card group">
              <span ref={guidesCounter.ref} className="font-display font-bold text-3xl text-primary group-hover:scale-110 transition-transform">{guidesCounter.count}</span>
              <span className="text-muted-foreground text-base">{language === 'bn' ? 'গাইড' : 'guides'}</span>
            </div>
            <div className="stat-card group">
              <span ref={portalsCounter.ref} className="font-display font-bold text-3xl text-primary group-hover:scale-110 transition-transform">{portalsCounter.count}</span>
              <span className="text-muted-foreground text-base">{language === 'bn' ? 'পোর্টাল' : 'portals'}</span>
            </div>
            <div className="stat-card group">
              <span ref={detailsCounter.ref} className="font-display font-bold text-3xl text-primary group-hover:scale-110 transition-transform">{detailsCounter.count}</span>
              <span className="text-muted-foreground text-base">{language === 'bn' ? 'বিস্তারিত তথ্য' : 'with details'}</span>
            </div>
            <div className="stat-card group">
              <span ref={citationsCounter.ref} className="font-display font-bold text-3xl text-primary group-hover:scale-110 transition-transform">{citationsCounter.count}</span>
              <span className="text-muted-foreground text-base">{language === 'bn' ? 'সাইটেশন' : 'citations'}</span>
            </div>
          </motion.div>

          {/* Quick Access Categories with staggered scale-in */}
          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={5}>
            <p className="text-sm md:text-base text-muted-foreground uppercase tracking-wider font-medium mb-6 text-center">
              {language === 'bn' ? 'জনপ্রিয় সেবা' : 'Popular Services'}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 max-w-3xl mx-auto">
              {categoryChips.map((chip, idx) => (
                <motion.div
                  key={chip.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7 + idx * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] as const }}
                >
                  <Link to={`/guides?search=${chip.search}`} className="pill-button inline-flex items-center gap-2">
                    <FaviconImage url={`https://${chip.domain}`} className="w-4 h-4" fallbackClassName="w-4 h-4" />
                    {language === 'bn' ? chip.labelBn : chip.label}
                  </Link>
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7 + categoryChips.length * 0.06, duration: 0.4 }}
              >
                <Link to="/guides" className="pill-button inline-flex items-center gap-2 !bg-primary/10 hover:!bg-primary/20 !text-primary !border-primary/25">
                  {language === 'bn' ? 'সব দেখুন' : 'View All'}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="section-padding border-y border-border bg-muted/30">
        <div className="container max-w-6xl">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6 }}
          >
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
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            {howItWorksSteps.map((step, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 40, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.5, delay: idx * 0.15 }}
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
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Government Portals */}
      <section className="section-padding">
        <div className="container max-w-6xl">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Building2 className="w-4 h-4" />
              {language === 'bn' ? 'সরকারি পোর্টাল' : 'Government Portals'}
            </div>
            <h2 className="text-foreground mb-4 text-balance">
              {language === 'bn' ? 'জনপ্রিয় সরকারি সাইট' : 'Featured Government Sites'}
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              {language === 'bn' ? 'সরাসরি অফিসিয়াল পোর্টালে যান' : 'Quick access to official portals'}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {featuredSites.map((site, idx) => (
              <motion.div
                key={site.url}
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.45, delay: idx * 0.1 }}
              >
                <Link
                  to={`/directory/${getSiteSlug(site.url)}`}
                  className="modern-card p-6 group text-center block h-full"
                >
                  <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <FaviconImage url={site.url} className="w-8 h-8" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors line-clamp-2">
                    {site.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {language === 'bn' ? site.categoryBn : site.category}
                  </p>
                </Link>
              </motion.div>
            ))}
          </div>

          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Button asChild variant="outline" size="lg" className="group">
              <Link to="/directory">
                <Globe className="w-4 h-4 mr-2" />
                {language === 'bn' ? 'সব পোর্টাল দেখুন' : 'Browse All Portals'}
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Featured Guides */}
      <section className="section-padding">
        <div className="container max-w-6xl">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-foreground mb-3">
              {t('home.popular')}
            </h2>
            <p className="text-lg text-muted-foreground">
              {language === 'bn' ? 'সবচেয়ে বেশি দেখা সেবা গাইড' : 'Most viewed service guides'}
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 gap-6 mb-10">
            {guides.slice(0, 4).map((guide, idx) => {
              const fullGuide = getGuideById(guide.guide_id);
              const agencyDomain = fullGuide ? getAgencyDomain(fullGuide.official_links) : null;
              
              return (
                <motion.div
                  key={guide.guide_id}
                  initial={{ opacity: 0, y: 35 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ duration: 0.5, delay: idx * 0.12 }}
                >
                  <Link 
                    to={`/guides/${guide.guide_id}`} 
                    className="modern-card p-8 group relative overflow-hidden block h-full"
                  >
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
                </motion.div>
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
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              {language === 'bn' ? 'কেন আমাদের বিশ্বাস করবেন' : 'Why trust us'}
            </div>
            <h2 className="text-foreground text-balance">
              {language === 'bn' ? 'কেন INFOBASE?' : 'Why INFOBASE?'}
            </h2>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: FileCheck, titleKey: 'home.feature1.title', descKey: 'home.feature1.desc' },
              { icon: CheckCircle2, titleKey: 'home.feature2.title', descKey: 'home.feature2.desc' },
              { icon: Clock, titleKey: 'home.feature3.title', descKey: 'home.feature3.desc' },
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.5, delay: idx * 0.15 }}
                className="feature-card group"
              >
                <div className="icon-container mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="w-7 h-7" />
                </div>
                <h3 className="text-foreground mb-4">
                  {t(feature.titleKey)}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {t(feature.descKey)}
                </p>
              </motion.div>
            ))}
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
                  <Link to="/about" className="text-primary underline hover:no-underline font-medium">
                    অফিসিয়াল সোর্সে
                  </Link>{' '}
                  যাচাই করুন।
                </>
              ) : (
                <>
                  This is an unofficial guide. Always verify on{' '}
                  <Link to="/about" className="text-primary underline hover:no-underline font-medium">
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
    </>
  );
}