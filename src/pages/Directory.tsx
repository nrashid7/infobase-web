import { useState, useMemo } from 'react';
import { Search, ExternalLink, Globe } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import { Input } from '@/components/ui/input';
import { govDirectory, getTotalWebsites } from '@/data/govDirectory';

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
            link.url.toLowerCase().includes(query)
        ),
      }))
      .filter((category) => category.links.length > 0);
  }, [search]);

  const filteredCount = useMemo(() => {
    return filteredCategories.reduce((sum, cat) => sum + cat.links.length, 0);
  }, [filteredCategories]);

  return (
    <div className="py-8 px-4">
      <div className="container max-w-5xl">
        {/* Header */}
        <header className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Globe className="w-5 h-5 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {language === 'bn' ? 'বাংলাদেশ সরকারি ওয়েবসাইট' : 'Bangladesh Government Websites'}
          </h1>
          <p className="text-muted-foreground mb-4">
            {language === 'bn' 
              ? 'বাংলাদেশের সকল অফিসিয়াল সরকারি ওয়েবসাইট এক জায়গায় খুঁজুন।'
              : 'Find all official government websites of Bangladesh in one place.'}
          </p>
          <p className="text-sm text-muted-foreground">
            {filteredCount} {language === 'bn' ? 'ওয়েবসাইট পাওয়া গেছে' : 'websites found'}
            {search && filteredCount !== totalWebsites && (
              <span className="text-muted-foreground/70"> ({language === 'bn' ? 'মোট' : 'of'} {totalWebsites})</span>
            )}
          </p>
        </header>

        {/* Search */}
        <div className="max-w-md mx-auto mb-10">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder={language === 'bn' ? 'ওয়েবসাইট খুঁজুন...' : 'Search websites...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="space-y-8">
          {filteredCategories.map((category) => (
            <section key={category.id}>
              <h2 className="text-lg font-semibold text-foreground mb-4 pb-2 border-b border-border">
                {language === 'bn' ? category.nameBn : category.name}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {category.links.map((link) => (
                  <a
                    key={link.url}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-3 p-3 rounded-lg bg-card border border-border hover:border-primary/50 hover:bg-accent/50 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                      <Globe className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <span className="text-sm text-foreground truncate flex-1">
                      {link.name}
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                  </a>
                ))}
              </div>
            </section>
          ))}
        </div>

        {filteredCategories.length === 0 && (
          <div className="text-center py-12 bg-muted/30 rounded-lg">
            <Globe className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {language === 'bn' ? 'কোন ওয়েবসাইট পাওয়া যায়নি।' : 'No websites found.'}
            </p>
          </div>
        )}

        {/* Disclaimer */}
        <div className="mt-10 p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground">
          <p>
            {language === 'bn' ? (
              <>
                <strong>নোট:</strong> INFOBASE একটি অনানুষ্ঠানিক ডিরেক্টরি। আমরা সুবিধার জন্য অফিসিয়াল সরকারি ওয়েবসাইটের লিংক সংকলন করি। পদক্ষেপ নেওয়ার আগে সর্বদা অফিসিয়াল পোর্টালে তথ্য যাচাই করুন।
              </>
            ) : (
              <>
                <strong>Note:</strong> INFOBASE is an unofficial directory. We compile links to official government websites for convenience. Always verify information on the official portals before taking action.
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
