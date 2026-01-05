import { Globe, ExternalLink } from 'lucide-react';
import { listOfficialSources } from '@/lib/guidesStore';
import { useLanguage } from '@/lib/LanguageContext';
import { Button } from '@/components/ui/button';

export default function OfficialSources() {
  const sources = listOfficialSources();
  const { t, language } = useLanguage();

  return (
    <div className="py-8 px-4">
      <div className="container max-w-3xl">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">{t('sources.title')}</h1>
          <p className="text-muted-foreground">
            {t('sources.subtitle')}
          </p>
        </header>

        {/* Sources List */}
        <div className="space-y-4">
          {sources.map((source) => (
            <div
              key={source.domain}
              className="bg-card border border-border rounded-lg p-5"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Globe className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground mb-1">
                    {source.domain}
                  </h3>
                  {source.titles.length > 0 && (
                    <p className="text-sm text-muted-foreground mb-3">
                      {source.titles.slice(0, 3).join(' • ')}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {source.urls.slice(0, 3).map((url, idx) => (
                      <Button
                        key={idx}
                        variant="outline"
                        size="sm"
                        asChild
                      >
                        <a href={url} target="_blank" rel="noopener noreferrer">
                          {language === 'bn' ? 'দেখুন' : 'Visit'}
                          <ExternalLink className="w-3 h-3 ml-1" />
                        </a>
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {sources.length === 0 && (
          <div className="text-center py-12 bg-muted/30 rounded-lg">
            <Globe className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {language === 'bn' ? 'কোন অফিসিয়াল সোর্স পাওয়া যায়নি।' : 'No official sources found.'}
            </p>
          </div>
        )}

        {/* Disclaimer */}
        <div className="mt-8 p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground">
          <p>
            {language === 'bn' ? (
              <>
                <strong>নোট:</strong> INFOBASE একটি অনানুষ্ঠানিক গাইড। আমরা বোঝার সুবিধার জন্য অফিসিয়াল সরকারি ওয়েবসাইট থেকে তথ্য সংকলন করি। পদক্ষেপ নেওয়ার আগে সর্বদা অফিসিয়াল পোর্টালে গুরুত্বপূর্ণ বিবরণ যাচাই করুন।
              </>
            ) : (
              <>
                <strong>Note:</strong> INFOBASE is an unofficial guide. We compile information from
                official government websites to make it easier to understand. Always verify
                important details on the official portals before taking action.
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
