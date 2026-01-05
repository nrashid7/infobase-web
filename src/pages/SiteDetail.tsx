import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Phone, Mail, MapPin, Clock, Globe, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FaviconImage } from '@/components/FaviconImage';
import { govDirectory } from '@/data/govDirectory';
import { getSiteByUrl, scrapeSite, findSiteBySlug, GovSiteDetails } from '@/lib/api/govSites';
import { useToast } from '@/hooks/use-toast';

export default function SiteDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { language } = useLanguage();
  const { toast } = useToast();
  
  const [siteDetails, setSiteDetails] = useState<GovSiteDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isScraping, setIsScraping] = useState(false);
  const [basicInfo, setBasicInfo] = useState<{ name: string; url: string; categoryId: string } | null>(null);

  // Find the site from the directory
  useEffect(() => {
    if (slug) {
      const found = findSiteBySlug(slug, govDirectory);
      setBasicInfo(found);
    }
  }, [slug]);

  // Fetch site details from database
  useEffect(() => {
    async function fetchDetails() {
      if (!basicInfo?.url) return;
      
      setIsLoading(true);
      const details = await getSiteByUrl(basicInfo.url);
      setSiteDetails(details);
      setIsLoading(false);
    }

    fetchDetails();
  }, [basicInfo?.url]);

  const handleScrape = async () => {
    if (!basicInfo) return;

    setIsScraping(true);
    toast({
      title: language === 'bn' ? 'তথ্য সংগ্রহ করা হচ্ছে...' : 'Fetching information...',
      description: language === 'bn' ? 'এতে কিছু সময় লাগতে পারে' : 'This may take a moment',
    });

    const result = await scrapeSite(basicInfo.url, basicInfo.name, basicInfo.categoryId);

    if (result.success && result.data) {
      setSiteDetails(result.data);
      toast({
        title: language === 'bn' ? 'সফল!' : 'Success!',
        description: language === 'bn' ? 'তথ্য সফলভাবে সংগ্রহ করা হয়েছে' : 'Information fetched successfully',
      });
    } else {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: result.error || (language === 'bn' ? 'তথ্য সংগ্রহ করতে ব্যর্থ' : 'Failed to fetch information'),
        variant: 'destructive',
      });
    }

    setIsScraping(false);
  };

  if (!basicInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">
            {language === 'bn' ? 'সাইট পাওয়া যায়নি' : 'Site not found'}
          </h2>
          <Link to="/directory">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {language === 'bn' ? 'ডিরেক্টরিতে ফিরে যান' : 'Back to Directory'}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const hasDetails = siteDetails?.scrape_status === 'success';
  const services = siteDetails?.services as { name: string; description: string }[] | undefined;
  const contactInfo = siteDetails?.contact_info as { phone?: string; email?: string; address?: string; fax?: string } | undefined;
  const relatedLinks = siteDetails?.related_links as { title: string; url: string }[] | undefined;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-b from-primary/5 via-background to-background py-12 md:py-16">
        <div className="container max-w-4xl mx-auto px-4">
          <Link 
            to="/directory" 
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {language === 'bn' ? 'ডিরেক্টরিতে ফিরে যান' : 'Back to Directory'}
          </Link>

          <div className="flex items-start gap-6">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-muted flex items-center justify-center flex-shrink-0">
              <FaviconImage url={basicInfo.url} className="w-10 h-10" fallbackClassName="w-10 h-10" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                {basicInfo.name}
              </h1>
              <a 
                href={basicInfo.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-primary hover:underline"
              >
                <Globe className="w-4 h-4" />
                {basicInfo.url}
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <a href={basicInfo.url} target="_blank" rel="noopener noreferrer">
              <Button>
                <ExternalLink className="w-4 h-4 mr-2" />
                {language === 'bn' ? 'অফিসিয়াল সাইটে যান' : 'Visit Official Site'}
              </Button>
            </a>
            <Button 
              variant="outline" 
              onClick={handleScrape}
              disabled={isScraping}
            >
              {isScraping ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              {isScraping 
                ? (language === 'bn' ? 'সংগ্রহ করা হচ্ছে...' : 'Fetching...') 
                : hasDetails 
                  ? (language === 'bn' ? 'তথ্য আপডেট করুন' : 'Refresh Info')
                  : (language === 'bn' ? 'তথ্য সংগ্রহ করুন' : 'Fetch Info')
              }
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container max-w-4xl mx-auto px-4 py-8 md:py-12">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : !hasDetails ? (
          <Card className="text-center py-12">
            <CardContent>
              <Globe className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                {language === 'bn' ? 'বিস্তারিত তথ্য উপলব্ধ নেই' : 'No detailed information available'}
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                {language === 'bn' 
                  ? 'এই সাইটের বিস্তারিত তথ্য এখনো সংগ্রহ করা হয়নি। "তথ্য সংগ্রহ করুন" বাটনে ক্লিক করে AI ব্যবহার করে তথ্য সংগ্রহ করুন।'
                  : 'Detailed information for this site has not been fetched yet. Click "Fetch Info" to use AI to gather information about this site.'}
              </p>
              <Button onClick={handleScrape} disabled={isScraping}>
                {isScraping ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                {isScraping 
                  ? (language === 'bn' ? 'সংগ্রহ করা হচ্ছে...' : 'Fetching...') 
                  : (language === 'bn' ? 'তথ্য সংগ্রহ করুন' : 'Fetch Info')
                }
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Description */}
            {siteDetails.description && (
              <Card>
                <CardHeader>
                  <CardTitle>{language === 'bn' ? 'বিবরণ' : 'Description'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    {siteDetails.description}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Mission */}
            {siteDetails.mission && (
              <Card>
                <CardHeader>
                  <CardTitle>{language === 'bn' ? 'লক্ষ্য ও উদ্দেশ্য' : 'Mission'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    {siteDetails.mission}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Services */}
            {services && services.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>{language === 'bn' ? 'সেবাসমূহ' : 'Services'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {services.map((service, index) => (
                      <div key={index} className="border-b border-border/50 last:border-0 pb-4 last:pb-0">
                        <h4 className="font-medium text-foreground mb-1">{service.name}</h4>
                        <p className="text-sm text-muted-foreground">{service.description}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Contact Info */}
            {contactInfo && Object.keys(contactInfo).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>{language === 'bn' ? 'যোগাযোগ' : 'Contact Information'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {contactInfo.phone && (
                      <div className="flex items-center gap-3">
                        <Phone className="w-5 h-5 text-muted-foreground" />
                        <span>{contactInfo.phone}</span>
                      </div>
                    )}
                    {contactInfo.email && (
                      <div className="flex items-center gap-3">
                        <Mail className="w-5 h-5 text-muted-foreground" />
                        <a href={`mailto:${contactInfo.email}`} className="text-primary hover:underline">
                          {contactInfo.email}
                        </a>
                      </div>
                    )}
                    {contactInfo.address && (
                      <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                        <span>{contactInfo.address}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Office Hours */}
            {siteDetails.office_hours && (
              <Card>
                <CardHeader>
                  <CardTitle>{language === 'bn' ? 'অফিস সময়' : 'Office Hours'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-muted-foreground" />
                    <span>{siteDetails.office_hours}</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Related Links */}
            {relatedLinks && relatedLinks.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>{language === 'bn' ? 'সম্পর্কিত লিংক' : 'Related Links'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {relatedLinks.map((link, index) => (
                      <a
                        key={index}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-primary hover:underline"
                      >
                        <ExternalLink className="w-4 h-4" />
                        {link.title}
                      </a>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Last Updated */}
            {siteDetails.last_scraped_at && (
              <div className="text-center text-sm text-muted-foreground">
                <Badge variant="outline">
                  {language === 'bn' ? 'সর্বশেষ যাচাই:' : 'Last verified:'}{' '}
                  {new Date(siteDetails.last_scraped_at).toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Badge>
              </div>
            )}
          </div>
        )}

        {/* Disclaimer */}
        <div className="mt-12 p-6 bg-muted/30 rounded-2xl text-center">
          <p className="text-sm text-muted-foreground">
            {language === 'bn'
              ? 'এটি একটি অনানুষ্ঠানিক তথ্য পৃষ্ঠা। সর্বদা অফিসিয়াল ওয়েবসাইট থেকে তথ্য যাচাই করুন।'
              : 'This is an unofficial information page. Always verify information from the official website.'}
          </p>
        </div>
      </div>
    </div>
  );
}
