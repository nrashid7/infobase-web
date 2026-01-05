import { useState, useMemo } from 'react';
import { Search, ExternalLink, Globe, Building2, Landmark, Users, Cpu, Scale, Banknote, GraduationCap, Heart, Leaf, Zap, Train, Wifi, MapPin, Briefcase, Users2, BarChart3, Shield, AlertTriangle, Anchor, List } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import { Input } from '@/components/ui/input';
import { govDirectory, getTotalWebsites } from '@/data/govDirectory';

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

export default function Directory() {
  const { language } = useLanguage();
  const [search, setSearch] = useState('');
  
  const totalWebsites = getTotalWebsites();

  const filteredCategories = useMemo(() => {
    if (!search.trim()) return govDirectory;
    
    const query = search.toLowerCase();
    return govDirectory
      .map((category) => ({
        ...category,
        links: category.links.filter(
          (link) =>
            link.name.toLowerCase().includes(query) ||
            link.url.toLowerCase().includes(query) ||
            category.name.toLowerCase().includes(query) ||
            category.nameBn.includes(query)
        ),
      }))
      .filter((category) => category.links.length > 0);
  }, [search]);

  const filteredCount = useMemo(() => {
    return filteredCategories.reduce((sum, cat) => sum + cat.links.length, 0);
  }, [filteredCategories]);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background">
        {/* Decorative background pattern */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute top-40 right-1/4 w-96 h-96 bg-accent-gold/10 rounded-full blur-3xl" />
        </div>
        
        <div className="relative py-16 px-4">
          <div className="container max-w-4xl mx-auto text-center">
            {/* Bangladesh Flag Icon */}
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 mb-6 animate-fade-in">
              <div className="w-12 h-8 rounded bg-[#006a4e] flex items-center justify-center">
                <div className="w-6 h-6 rounded-full bg-[#f42a41]" />
              </div>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-3 animate-fade-in" style={{ animationDelay: '0.1s' }}>
              {language === 'bn' ? 'সরকারি পোর্টাল সংগ্রহ' : 'Official Portal Collection'}
            </h1>
            
            <p className="text-xl text-primary font-medium mb-4 animate-fade-in" style={{ animationDelay: '0.15s' }}>
              {language === 'bn' ? 'সম্পূর্ণ রেফারেন্স গাইড' : 'Complete Reference Guide'}
            </p>
            
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto animate-fade-in" style={{ animationDelay: '0.2s' }}>
              {language === 'bn' 
                ? 'সরকারি মন্ত্রণালয়, সংস্থা এবং পরিষেবার সরাসরি লিংক এক জায়গায়।'
                : 'Direct links to government ministries, agencies, and services—organized for easy access.'}
            </p>

            {/* Search Bar */}
            <div className="max-w-xl mx-auto mb-6 animate-fade-in" style={{ animationDelay: '0.25s' }}>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder={language === 'bn' ? 'মন্ত্রণালয়, সংস্থা বা পরিষেবা খুঁজুন...' : 'Find a ministry, agency, or service...'}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-12 pr-4 py-6 text-base rounded-xl border-border/50 bg-background shadow-sm focus:shadow-md transition-shadow"
                />
              </div>
            </div>

            {/* Count */}
            <p className="text-sm text-muted-foreground animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <span className="font-semibold text-foreground">{filteredCount}</span> {language === 'bn' ? 'টি পোর্টাল তালিকাভুক্ত' : 'portals listed'}
              {search && filteredCount !== totalWebsites && (
                <span className="text-muted-foreground/70"> ({language === 'bn' ? 'মোট' : 'of'} {totalWebsites})</span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="py-12 px-4">
        <div className="container max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCategories.map((category, index) => {
              const IconComponent = categoryIcons[category.id] || Globe;
              return (
                <div 
                  key={category.id} 
                  className="modern-card p-5 animate-fade-in"
                  style={{ animationDelay: `${0.05 * index}s` }}
                >
                  {/* Category Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <IconComponent className="w-5 h-5 text-primary" />
                    </div>
                    <h2 className="font-semibold text-foreground">
                      {language === 'bn' ? category.nameBn : category.name}
                    </h2>
                  </div>

                  {/* Links List */}
                  <ul className="space-y-1">
                    {category.links.map((link) => (
                      <li key={link.url}>
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group flex items-center gap-2.5 py-2 px-2 -mx-2 rounded-lg hover:bg-accent/50 transition-colors"
                        >
                          <div className="w-5 h-5 rounded bg-muted flex items-center justify-center flex-shrink-0">
                            <Globe className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors" />
                          </div>
                          <span className="text-sm text-foreground/80 group-hover:text-primary transition-colors truncate flex-1">
                            {link.name}
                          </span>
                          <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          {filteredCategories.length === 0 && (
            <div className="text-center py-16 bg-muted/30 rounded-xl">
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-lg font-medium text-foreground mb-2">
                {language === 'bn' ? 'কোন ফলাফল পাওয়া যায়নি' : 'No results found'}
              </p>
              <p className="text-muted-foreground">
                {language === 'bn' 
                  ? `"${search}" এর জন্য কোন ওয়েবসাইট পাওয়া যায়নি।` 
                  : `No websites found for "${search}".`}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer Section */}
      <div className="py-12 px-4 border-t border-border/50 bg-muted/20">
        <div className="container max-w-4xl mx-auto">
          {/* Action Buttons */}
          <div className="flex flex-wrap justify-center gap-3 mb-6">
            <a
              href="mailto:contact@infobase.gov.bd?subject=Report%20Broken%20Link"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-border bg-background hover:bg-accent/50 text-sm font-medium text-foreground transition-colors"
            >
              {language === 'bn' ? 'ভাঙা লিংক রিপোর্ট করুন' : 'Report Broken Link'}
            </a>
            <a
              href="mailto:contact@infobase.gov.bd?subject=Suggest%20New%20Website"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-border bg-background hover:bg-accent/50 text-sm font-medium text-foreground transition-colors"
            >
              {language === 'bn' ? 'নতুন ওয়েবসাইট সাজেস্ট করুন' : 'Suggest New Website'}
            </a>
          </div>

          {/* Disclaimer */}
          <div className="text-center text-sm text-muted-foreground max-w-2xl mx-auto mb-4">
            <p>
              {language === 'bn' 
                ? 'এটি বাংলাদেশ সরকারের ওয়েবসাইটগুলির একটি অনানুষ্ঠানিক ডিরেক্টরি। সমস্ত লিংক আপনার সুবিধার জন্য নতুন ট্যাবে খোলে। আপনি যদি কোন ভাঙা লিংক খুঁজে পান বা এই ডিরেক্টরিতে সংযোজন সুপারিশ করতে চান, অনুগ্রহ করে আমাদের জানান।'
                : 'This is an unofficial directory of government websites of Bangladesh. All links open in a new tab for your convenience. If you find any broken links or would like to suggest additions to this directory, please let us know.'}
            </p>
          </div>

          {/* Last Updated */}
          <p className="text-center text-xs text-primary font-medium">
            {language === 'bn' ? 'সর্বশেষ আপডেট: ২ জানুয়ারি ২০২৬' : 'Last updated: 2nd Jan 2026'}
          </p>
        </div>
      </div>
    </div>
  );
}
