import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ExternalLink, Phone, Mail, MapPin, Clock, Globe, Loader2, AlertCircle, Building2, Target, ListChecks, Link2, ArrowLeft, FileText, Users, CreditCard, FileCheck } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FaviconImage } from '@/components/FaviconImage';
import { govDirectory } from '@/data/govDirectory';
import { getSiteByUrl, findSiteBySlug, GovSiteDetails } from '@/lib/api/govSites';

import { Breadcrumbs } from '@/components/Breadcrumbs';
import { getCategoryBranding, isValidContactValue, formatAddressDisplay } from '@/data/govBranding';

// Service icon mapping based on keywords
function getServiceIcon(serviceName: string) {
  const name = serviceName.toLowerCase();
  if (name.includes('certificate') || name.includes('license') || name.includes('registration')) {
    return FileCheck;
  }
  if (name.includes('payment') || name.includes('fee') || name.includes('tax') || name.includes('bill')) {
    return CreditCard;
  }
  if (name.includes('application') || name.includes('form') || name.includes('document')) {
    return FileText;
  }
  if (name.includes('citizen') || name.includes('public') || name.includes('people')) {
    return Users;
  }
  return ListChecks;
}

export default function SiteDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { language } = useLanguage();
  
  const [siteDetails, setSiteDetails] = useState<GovSiteDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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
  const rawContactInfo = siteDetails?.contact_info as Record<string, unknown> | undefined;
  const relatedLinks = siteDetails?.related_links as { title: string; url?: string | null }[] | undefined;
  
  // Normalize contact info - handle both string and object values, filter invalid
  const normalizeContactValue = (value: unknown): string | null => {
    if (!value) return null;
    if (typeof value === 'string') {
      return isValidContactValue(value) ? value : null;
    }
    if (typeof value === 'object') {
      const entries = Object.entries(value as Record<string, string>)
        .filter(([_, v]) => v && typeof v === 'string' && isValidContactValue(v))
        .map(([k, v]) => `${k.charAt(0).toUpperCase() + k.slice(1).replace(/_/g, ' ')}: ${v}`);
      return entries.length > 0 ? entries.join('\n') : null;
    }
    return null;
  };
  
  const contactInfo = rawContactInfo ? {
    phone: normalizeContactValue(rawContactInfo.phone),
    email: normalizeContactValue(rawContactInfo.email),
    address: normalizeContactValue(rawContactInfo.address),
    fax: normalizeContactValue(rawContactInfo.fax),
  } : undefined;
  
  // Check if we have any valid contact info
  const hasValidContact = contactInfo && (contactInfo.phone || contactInfo.email || contactInfo.address || contactInfo.fax);
  
  // Filter related links with valid URLs and decode for display
  const validRelatedLinks = relatedLinks?.filter(link => link.url && link.url.startsWith('http'));
  
  // Get primary color with fallback to category branding
  const categoryBranding = getCategoryBranding(basicInfo.categoryId);
  const primaryColor = siteDetails?.primary_color || categoryBranding.primaryColor;

  // Get category name
  const category = govDirectory.find(c => c.id === basicInfo.categoryId);
  const categoryName = category ? (language === 'bn' ? category.nameBn : category.name) : '';

  // Helper to decode URL for display
  const decodeUrlForDisplay = (url: string): string => {
    try {
      return decodeURIComponent(url);
    } catch {
      return url;
    }
  };

  // Helper to create clickable phone link
  const renderPhoneLink = (phone: string) => {
    const phoneLines = phone.split('\n');
    return phoneLines.map((line, idx) => {
      // Extract phone number from line (might have label like "General: +880...")
      const match = line.match(/(\+?\d[\d\s\-()]+)/);
      const phoneNumber = match ? match[1].replace(/[\s\-()]/g, '') : null;
      
      return (
        <span key={idx} className="block">
          {phoneNumber ? (
            <a 
              href={`tel:${phoneNumber}`} 
              className="hover:underline"
              style={{ color: primaryColor }}
            >
              {line}
            </a>
          ) : (
            line
          )}
        </span>
      );
    });
  };

  // Helper to create clickable email link
  const renderEmailLink = (email: string) => {
    const emailLines = email.split('\n');
    return emailLines.map((line, idx) => {
      // Extract email from line
      const match = line.match(/([^\s:]+@[^\s]+)/);
      const emailAddress = match ? match[1] : null;
      
      return (
        <span key={idx} className="block">
          {emailAddress ? (
            <a 
              href={`mailto:${emailAddress}`} 
              className="hover:underline"
              style={{ color: primaryColor }}
            >
              {line}
            </a>
          ) : (
            line
          )}
        </span>
      );
    });
  };

  // Helper to create Google Maps link for address
  const renderAddressLink = (address: string) => {
    const encodedAddress = encodeURIComponent(address);
    return (
      <a 
        href={`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`}
        target="_blank"
        rel="noopener noreferrer"
        className="hover:underline group"
      >
        <span className="whitespace-pre-wrap">{formatAddressDisplay(address)}</span>
        <ExternalLink className="w-3 h-3 inline-block ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
      </a>
    );
  };

  return (
    <div className="min-h-screen">
      {/* Hero Header with dynamic color */}
      <div 
        className="relative py-12 md:py-20 overflow-hidden"
        style={{ 
          background: `linear-gradient(135deg, ${primaryColor}15 0%, transparent 50%), linear-gradient(to bottom, hsl(var(--primary)/0.05), hsl(var(--background)))`
        }}
      >
        {/* Decorative elements */}
        <div 
          className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-20"
          style={{ background: primaryColor }}
        />
        <div 
          className="absolute bottom-0 left-0 w-64 h-64 rounded-full blur-3xl opacity-10"
          style={{ background: primaryColor }}
        />
        
        <div className="container max-w-5xl mx-auto px-4 relative">
          {/* Breadcrumbs */}
          <Breadcrumbs 
            items={[
              { label: language === 'bn' ? 'ডিরেক্টরি' : 'Directory', href: '/directory' },
              { label: basicInfo.name }
            ]} 
            className="mb-8"
          />

          <div className="flex flex-col md:flex-row items-start gap-6 md:gap-8">
            {/* Logo */}
            <div 
              className="w-20 h-20 md:w-28 md:h-28 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg"
              style={{ 
                background: `linear-gradient(135deg, ${primaryColor}20, ${primaryColor}10)`,
                border: `1px solid ${primaryColor}30`
              }}
            >
              {siteDetails?.logo_url ? (
                <img 
                  src={siteDetails.logo_url} 
                  alt={basicInfo.name}
                  className="w-16 h-16 md:w-20 md:h-20 object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <FaviconImage 
                url={basicInfo.url} 
                className={`w-12 h-12 md:w-16 md:h-16 ${siteDetails?.logo_url ? 'hidden' : ''}`} 
                fallbackClassName="w-12 h-12" 
              />
            </div>

            {/* Title and meta */}
            <div className="flex-1 min-w-0">
              {categoryName && (
                <Badge 
                  variant="outline" 
                  className="mb-3"
                  style={{ borderColor: `${primaryColor}50`, color: primaryColor }}
                >
                  {categoryName}
                </Badge>
              )}
              <h1 className="text-2xl md:text-4xl font-bold text-foreground mb-3 leading-tight">
                {basicInfo.name}
              </h1>
              <a 
                href={basicInfo.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm md:text-base"
              >
                <Globe className="w-4 h-4" />
                <span className="truncate max-w-xs md:max-w-md">{basicInfo.url}</span>
                <ExternalLink className="w-3 h-3 flex-shrink-0" />
              </a>
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-8 flex flex-wrap gap-3">
            <a href={basicInfo.url} target="_blank" rel="noopener noreferrer">
              <Button 
                size="lg"
                style={{ background: primaryColor }}
                className="hover:opacity-90 text-white"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                {language === 'bn' ? 'অফিসিয়াল সাইটে যান' : 'Visit Official Site'}
              </Button>
            </a>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container max-w-5xl mx-auto px-4 py-8 md:py-12">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : !hasDetails ? (
          <Card className="text-center py-16 border-dashed">
            <CardContent>
              <div 
                className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center"
                style={{ background: `${primaryColor}15` }}
              >
                <Building2 className="w-10 h-10" style={{ color: primaryColor }} />
              </div>
              <h3 className="text-xl font-semibold mb-3">
                {language === 'bn' ? 'বিস্তারিত তথ্য উপলব্ধ নেই' : 'No detailed information available yet'}
              </h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                {language === 'bn' 
                  ? 'এই সাইটের বিস্তারিত তথ্য শীঘ্রই যোগ করা হবে। অফিসিয়াল ওয়েবসাইট দেখুন।'
                  : 'Detailed information for this site will be added soon. Please visit the official website for now.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main content - 2 columns */}
            <div className="lg:col-span-2 space-y-6">
              {/* Description */}
              {siteDetails.description && (
                <Card className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Building2 className="w-5 h-5" style={{ color: primaryColor }} />
                      {language === 'bn' ? 'বিবরণ' : 'About'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-foreground leading-relaxed text-base">
                      {siteDetails.description}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Mission */}
              {siteDetails.mission && (
                <Card className="overflow-hidden border-l-4" style={{ borderLeftColor: primaryColor }}>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Target className="w-5 h-5" style={{ color: primaryColor }} />
                      {language === 'bn' ? 'লক্ষ্য ও উদ্দেশ্য' : 'Mission & Vision'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-foreground leading-relaxed italic">
                      "{siteDetails.mission}"
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Services */}
              {services && services.length > 0 && (
                <Card className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <ListChecks className="w-5 h-5" style={{ color: primaryColor }} />
                      {language === 'bn' ? 'সেবাসমূহ' : 'Services'}
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {services.length}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {services.slice(0, 6).map((service, index) => {
                        const ServiceIcon = getServiceIcon(service.name);
                        return (
                          <div 
                            key={index}
                            className="p-4 rounded-xl bg-muted/50 border border-border/50 hover:border-border transition-colors group"
                          >
                            <div className="flex items-start gap-3">
                              <div 
                                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                style={{ background: `${primaryColor}15` }}
                              >
                                <ServiceIcon className="w-4 h-4" style={{ color: primaryColor }} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-foreground text-sm mb-1">{service.name}</h4>
                                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                                  {service.description}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar - 1 column */}
            <div className="space-y-6">
              {/* Contact Info */}
              {hasValidContact && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">{language === 'bn' ? 'যোগাযোগ' : 'Contact'}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {contactInfo.phone && (
                      <div className="flex items-start gap-3">
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: `${primaryColor}15` }}
                        >
                          <Phone className="w-5 h-5" style={{ color: primaryColor }} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-muted-foreground mb-0.5">{language === 'bn' ? 'ফোন' : 'Phone'}</p>
                          <div className="font-medium text-sm">
                            {renderPhoneLink(contactInfo.phone)}
                          </div>
                        </div>
                      </div>
                    )}
                    {contactInfo.email && (
                      <div className="flex items-start gap-3">
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: `${primaryColor}15` }}
                        >
                          <Mail className="w-5 h-5" style={{ color: primaryColor }} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-muted-foreground mb-0.5">{language === 'bn' ? 'ইমেইল' : 'Email'}</p>
                          <div className="font-medium text-sm break-all">
                            {renderEmailLink(contactInfo.email)}
                          </div>
                        </div>
                      </div>
                    )}
                    {contactInfo.fax && (
                      <div className="flex items-start gap-3">
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: `${primaryColor}15` }}
                        >
                          <Phone className="w-5 h-5" style={{ color: primaryColor }} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-muted-foreground mb-0.5">{language === 'bn' ? 'ফ্যাক্স' : 'Fax'}</p>
                          <p className="font-medium whitespace-pre-wrap break-words text-sm">{contactInfo.fax}</p>
                        </div>
                      </div>
                    )}
                    {contactInfo.address && (
                      <div className="flex items-start gap-3">
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: `${primaryColor}15` }}
                        >
                          <MapPin className="w-5 h-5" style={{ color: primaryColor }} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-muted-foreground mb-0.5">{language === 'bn' ? 'ঠিকানা' : 'Address'}</p>
                          <div className="font-medium text-sm">
                            {renderAddressLink(contactInfo.address)}
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Office Hours */}
              {siteDetails.office_hours && isValidContactValue(siteDetails.office_hours) && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">{language === 'bn' ? 'অফিস সময়' : 'Office Hours'}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-start gap-3">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: `${primaryColor}15` }}
                      >
                        <Clock className="w-5 h-5" style={{ color: primaryColor }} />
                      </div>
                      <p className="font-medium pt-2 text-sm whitespace-pre-wrap">{siteDetails.office_hours}</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Related Links */}
              {validRelatedLinks && validRelatedLinks.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Link2 className="w-4 h-4" />
                      {language === 'bn' ? 'সম্পর্কিত লিংক' : 'Related Links'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {validRelatedLinks.slice(0, 5).map((link, index) => (
                        <a
                          key={index}
                          href={link.url!}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted transition-colors group text-sm"
                        >
                          <FaviconImage 
                            url={link.url!} 
                            className="w-4 h-4 flex-shrink-0" 
                            fallbackClassName="w-4 h-4"
                          />
                          <span className="truncate group-hover:text-foreground flex-1">
                            {decodeUrlForDisplay(link.title)}
                          </span>
                          <ExternalLink className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                        </a>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Last Updated Badge */}
              {siteDetails.last_scraped_at && (
                <div className="text-center">
                  <Badge variant="secondary" className="text-xs">
                    {language === 'bn' ? 'সর্বশেষ যাচাই:' : 'Last verified:'}{' '}
                    {new Date(siteDetails.last_scraped_at).toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </Badge>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Disclaimer */}
        <div className="mt-12 p-6 bg-muted/30 rounded-2xl text-center border border-border/50">
          <p className="text-sm text-muted-foreground">
            {language === 'bn'
              ? '⚠️ এটি একটি অনানুষ্ঠানিক তথ্য পৃষ্ঠা। AI দ্বারা সংগৃহীত তথ্য সম্পূর্ণ নাও হতে পারে। সর্বদা অফিসিয়াল ওয়েবসাইট থেকে তথ্য যাচাই করুন।'
              : '⚠️ This is an unofficial information page. AI-gathered information may not be complete. Always verify from the official website.'}
          </p>
        </div>
      </div>
    </div>
  );
}
