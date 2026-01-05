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
              {language === 'bn' ? 'বাংলাদেশ সরকারি ওয়েবসাইট' : 'Bangladesh Government Websites'}
            </h1>
            
            <p className="text-xl text-primary font-medium mb-4 animate-fade-in" style={{ animationDelay: '0.15s' }}>
              {language === 'bn' ? 'অনানুষ্ঠানিক ডিরেক্টরি' : 'Unofficial Directory'}
            </p>
            
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto animate-fade-in" style={{ animationDelay: '0.2s' }}>
              {language === 'bn' 
                ? 'বাংলাদেশের সকল অফিসিয়াল সরকারি ওয়েবসাইট এক জায়গায় খুঁজুন।'
                : 'Find all official government websites of Bangladesh in one place.'}
            </p>

            {/* Search Bar */}
            <div className="max-w-xl mx-auto mb-6 animate-fade-in" style={{ animationDelay: '0.25s' }}>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder={language === 'bn' ? 'সরকারি ওয়েবসাইট বা বিভাগ খুঁজুন...' : 'Search for government websites or categories...'}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-12 pr-4 py-6 text-base rounded-xl border-border/50 bg-background shadow-sm focus:shadow-md transition-shadow"
                />
              </div>
            </div>

            {/* Count */}
            <p className="text-sm text-muted-foreground animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <span className="font-semibold text-foreground">{filteredCount}</span> {language === 'bn' ? 'ওয়েবসাইট পাওয়া গেছে' : 'websites found'}
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

      {/* Disclaimer */}
      <div className="py-8 px-4 border-t border-border/50">
        <div className="container max-w-4xl mx-auto">
          <div className="text-center text-sm text-muted-foreground">
            <p>
              {language === 'bn' ? (
                <>
                  <strong className="text-foreground">নোট:</strong> INFOBASE একটি অনানুষ্ঠানিক ডিরেক্টরি। আমরা সুবিধার জন্য অফিসিয়াল সরকারি ওয়েবসাইটের লিংক সংকলন করি। পদক্ষেপ নেওয়ার আগে সর্বদা অফিসিয়াল পোর্টালে তথ্য যাচাই করুন।
                </>
              ) : (
                <>
                  <strong className="text-foreground">Note:</strong> INFOBASE is an unofficial directory. We compile links to official government websites for convenience. Always verify information on the official portals before taking action.
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
