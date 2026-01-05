import { Link } from 'react-router-dom';
import { Building2, ArrowRight, CheckCircle, Shield, Clock, FileCheck } from 'lucide-react';
import { getGuideStats, listGuides } from '@/lib/guidesStore';
import { useLanguage } from '@/lib/LanguageContext';
import { GlobalSearch } from '@/components/GlobalSearch';
import { Button } from '@/components/ui/button';

// Category chips for quick navigation
const categoryChips = [
  { label: 'Passport', labelBn: 'পাসপোর্ট', search: 'passport' },
  { label: 'NID', labelBn: 'এনআইডি', search: 'nid' },
  { label: 'Driving License', labelBn: 'ড্রাইভিং লাইসেন্স', search: 'driving' },
  { label: 'Birth Certificate', labelBn: 'জন্ম সনদ', search: 'birth' },
  { label: 'Visa', labelBn: 'ভিসা', search: 'visa' },
];

export default function Index() {
  const stats = getGuideStats();
  const guides = listGuides();
  const { t, language } = useLanguage();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/5 via-background to-accent/10 py-20 px-4">
        <div className="container max-w-4xl text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-6">
            <Building2 className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 tracking-tight">
            {t('home.title')}
          </h1>
          <p className="text-xl text-primary font-medium mb-3">{t('home.subtitle')}</p>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
            {language === 'bn' 
              ? 'সরকারি সেবার জন্য স্পষ্ট নির্দেশনা, ফি, প্রয়োজনীয় কাগজপত্র এবং প্রসেসিং সময় খুঁজুন। সমস্ত তথ্য অফিসিয়াল পোর্টাল থেকে সংগৃহীত।'
              : 'Find clear instructions, fees, required documents, and processing times for government services. All information is sourced from official portals.'}
          </p>
          
          <GlobalSearch 
            className="max-w-xl mx-auto mb-6" 
            placeholder={t('home.search.placeholder')}
          />

          {/* Category Chips */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            {categoryChips.map((chip) => (
              <Link
                key={chip.label}
                to={`/guides?search=${chip.search}`}
                className="px-4 py-2 bg-card border border-border rounded-full text-sm font-medium text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
              >
                {language === 'bn' ? chip.labelBn : chip.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Simple Stats */}
      <section className="py-6 px-4 border-b border-border bg-muted/30">
        <div className="container">
          <div className="flex flex-wrap items-center justify-center gap-8 text-center text-sm text-muted-foreground">
            <span><strong className="text-foreground">{stats.guides}</strong> {t('stats.services').toLowerCase()}</span>
            <span>•</span>
            <span><strong className="text-foreground">{stats.agencies}</strong> {t('stats.agencies').toLowerCase()}</span>
            <span>•</span>
            <span><strong className="text-foreground">{stats.totalCitations}</strong> {language === 'bn' ? 'অফিসিয়াল সাইটেশন' : 'official citations'}</span>
          </div>
        </div>
      </section>

      {/* Featured Guides */}
      <section className="py-12 px-4">
        <div className="container max-w-4xl">
          <h2 className="text-xl font-semibold text-foreground text-center mb-8">
            {t('home.popular')}
          </h2>
          
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            {guides.slice(0, 4).map((guide) => (
              <Link
                key={guide.guide_id}
                to={`/guides/${guide.guide_id}`}
                className="bg-card border border-border rounded-xl p-5 hover:shadow-lg hover:border-primary/30 transition-all group"
              >
                <p className="text-xs text-muted-foreground mb-2 uppercase">
                  {guide.agency_name}
                </p>
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors mb-2">
                  {guide.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {guide.step_count > 0 
                    ? `${guide.step_count} ${language === 'bn' ? 'ধাপ' : 'steps'}` 
                    : language === 'bn' ? 'সেবার তথ্য' : 'Service information'}
                  {guide.citation_count > 0 && ` • ${guide.citation_count} ${language === 'bn' ? 'সাইটেশন' : 'citations'}`}
                </p>
                <span className="text-sm text-primary font-medium inline-flex items-center gap-1">
                  {t('action.viewDetails')}
                  <ArrowRight className="w-4 h-4" />
                </span>
              </Link>
            ))}
          </div>

          <div className="text-center">
            <Button asChild variant="outline" size="lg">
              <Link to="/guides">
                {t('home.viewAll')}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-12 px-4 bg-muted/30 border-t border-border">
        <div className="container max-w-4xl">
          <h2 className="text-xl font-semibold text-foreground text-center mb-8">
            {language === 'bn' ? 'কেন INFOBASE ব্যবহার করবেন?' : 'Why use INFOBASE?'}
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <FileCheck className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">
                {language === 'bn' ? 'অফিসিয়াল সোর্স' : 'Official sources'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {language === 'bn' 
                  ? 'প্রতিটি তথ্য অফিসিয়াল সরকারি ওয়েবসাইট থেকে সংগৃহীত যা আপনি যাচাই করতে পারবেন।'
                  : 'Every piece of information comes from official government websites with citations you can verify.'}
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">
                {language === 'bn' ? 'সহজে অনুসরণযোগ্য' : 'Easy to follow'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {language === 'bn'
                  ? 'স্পষ্ট ধাপে ধাপে নির্দেশনা সহ ফি, কাগজপত্র এবং সময়সীমা এক জায়গায়।'
                  : 'Clear step-by-step instructions with fees, documents, and timelines all in one place.'}
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Clock className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">
                {language === 'bn' ? 'সময় বাঁচান' : 'Save time'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {language === 'bn'
                  ? 'একাধিক ওয়েবসাইটে খোঁজাখুঁজি বন্ধ করুন। একটি গাইডে সব তথ্য পান।'
                  : 'No more hunting through multiple websites. Get all the information you need in one guide.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="py-8 px-4 bg-background border-t border-border">
        <div className="container max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 text-muted-foreground text-sm">
            <Shield className="w-4 h-4" />
            <span>
              {language === 'bn' 
                ? <>এটি একটি অনানুষ্ঠানিক গাইড। পদক্ষেপ নেওয়ার আগে সর্বদা <Link to="/about" className="text-primary hover:underline">অফিসিয়াল সোর্সে</Link> যাচাই করুন।</>
                : <>This is an unofficial guide. Always verify on{' '}<Link to="/about" className="text-primary hover:underline">official sources</Link>{' '}before taking action.</>}
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
