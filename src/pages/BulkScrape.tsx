import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { govDirectory } from '@/data/govDirectory';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircle, XCircle, Loader2, Play, RefreshCw, Search, 
  Clock, AlertTriangle, Globe, Filter, Database, ExternalLink, Lock, ArrowRight
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import { getSiteSlug } from '@/lib/api/govSiteUtils';

const VALIDATION_STORAGE_KEY = 'bulkScrape_validationResults';
const URL_OVERRIDES_KEY = 'bulkScrape_urlOverrides';

interface ValidationResult {
  urlStatus: SiteStatus['urlStatus'];
  urlError?: string;
  pageTitle?: string;
  finalUrl?: string;
}

function loadValidationResults(): Record<string, ValidationResult> {
  try {
    const stored = localStorage.getItem(VALIDATION_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch { return {}; }
}

function saveValidationResults(results: Record<string, ValidationResult>) {
  try { localStorage.setItem(VALIDATION_STORAGE_KEY, JSON.stringify(results)); } catch { /* localStorage may be unavailable */ }
}

function loadUrlOverrides(): Record<string, string> {
  try {
    const stored = localStorage.getItem(URL_OVERRIDES_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch { return {}; }
}

function saveUrlOverrides(overrides: Record<string, string>) {
  try { localStorage.setItem(URL_OVERRIDES_KEY, JSON.stringify(overrides)); } catch { /* localStorage may be unavailable */ }
}

interface SiteStatus {
  name: string;
  url: string;
  categoryId: string;
  categoryName: string;
  dbStatus: 'not_scraped' | 'pending' | 'in_progress' | 'success' | 'failed' | 'incomplete';
  lastScraped?: string;
  hasDescription: boolean;
  hasContact: boolean;
  hasServices: boolean;
  scrapeError?: string;
  scrapeMethod?: string;
  contentQuality?: number;
  urlStatus?: 'checking' | 'valid' | 'invalid' | 'unknown' | 'mismatch' | 'redirect';
  urlError?: string;
  pageTitle?: string;
  finalUrl?: string;
}

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'infobase2026';

export default function BulkScrape() {
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [sites, setSites] = useState<SiteStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isScraping, setIsScraping] = useState(false);
  const [activeUrls, setActiveUrls] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [isValidating, setIsValidating] = useState(false);
  const [validationProgress, setValidationProgress] = useState(0);

  // Get all sites from directory with category names
  const allDirectorySites = useMemo(() => govDirectory.flatMap(cat => 
    cat.links.map(link => ({
      name: link.name,
      url: link.url,
      categoryId: cat.id,
      categoryName: cat.name,
    }))
  ), []);

  // Load site statuses from database
  const loadSiteStatuses = async () => {
    setIsLoading(true);
    try {
      const { data: dbSites, error } = await supabase
        .from('gov_site_details')
        .select('url, scrape_status, last_scraped_at, description, contact_info, services, scrape_error, content_quality');
      
      if (error) {
        console.error('Error loading site statuses:', error);
        return;
      }

      const dbMap = new Map(dbSites?.map(s => [s.url, s]) || []);
      const savedValidation = loadValidationResults();
      const overrides = loadUrlOverrides();

      const siteStatuses: SiteStatus[] = allDirectorySites.map(site => {
        // Apply URL override if exists
        const effectiveUrl = overrides[site.url] || site.url;
        const dbEntry = dbMap.get(effectiveUrl) || dbMap.get(site.url);
        const validation = savedValidation[site.url];
        
        return {
          ...site,
          url: effectiveUrl,
          dbStatus: dbEntry?.scrape_status as SiteStatus['dbStatus'] || 'not_scraped',
          lastScraped: dbEntry?.last_scraped_at || undefined,
          hasDescription: !!dbEntry?.description,
          hasContact: !!(dbEntry?.contact_info && Object.keys(dbEntry.contact_info as object).length > 0),
          hasServices: !!(dbEntry?.services && Array.isArray(dbEntry.services) && (dbEntry.services as unknown[]).length > 0),
          scrapeError: dbEntry?.scrape_error || undefined,
          scrapeMethod: undefined,
          contentQuality: dbEntry?.content_quality as number | undefined,
          urlStatus: validation?.urlStatus,
          urlError: validation?.urlError,
          pageTitle: validation?.pageTitle,
          finalUrl: validation?.finalUrl,
        };
      });

      setSites(siteStatuses);
    } catch (err) {
      console.error('Exception loading site statuses:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) loadSiteStatuses();
  }, [isAuthenticated]);

  // Handle accepting a redirect URL
  const handleAcceptRedirect = useCallback((originalUrl: string, redirectUrl: string) => {
    const overrides = loadUrlOverrides();
    overrides[originalUrl] = redirectUrl;
    saveUrlOverrides(overrides);
    
    // Update local state
    setSites(prev => prev.map(s => {
      if (s.url === originalUrl) {
        return { ...s, url: redirectUrl, urlStatus: 'valid', urlError: undefined, finalUrl: undefined };
      }
      return s;
    }));

    // Update validation results
    const validation = loadValidationResults();
    delete validation[originalUrl];
    saveValidationResults(validation);

    toast({ title: 'URL Updated', description: `Updated to ${redirectUrl}` });
  }, [toast]);

  const scrapeSite = async (site: SiteStatus): Promise<boolean> => {
    setActiveUrls(prev => [...prev, site.url]);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 180000);

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/scrape-gov-site`, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey,
        },
        body: JSON.stringify({ url: site.url, name: site.name, categoryId: site.categoryId }),
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error(`Error scraping ${site.name}: HTTP ${response.status}`);
        return false;
      }

      const data = await response.json();
      if (data?.method) console.log(`[${site.name}] Method: ${data.method}, Quality: ${data.quality}`);
      return data?.success || false;
    } catch (err) {
      console.error(`Exception scraping ${site.name}:`, err);
      return false;
    } finally {
      setActiveUrls(prev => prev.filter(u => u !== site.url));
    }
  };

  const handleSingleScrape = async (site: SiteStatus) => {
    setIsScraping(true);
    toast({
      title: 'Scraping...',
      description: `Fetching info for ${site.name}`,
    });

    const success = await scrapeSite(site);
    
    if (success) {
      toast({ title: 'Success!', description: `${site.name} scraped successfully` });
    } else {
      toast({ title: 'Failed', description: `Failed to scrape ${site.name}`, variant: 'destructive' });
    }

    await loadSiteStatuses();
    setIsScraping(false);
  };

  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0, success: 0, failed: 0 });
  const cancelRef = useRef(false);

  const handleStopScrape = () => {
    cancelRef.current = true;
  };

  const CONCURRENCY = 3;
  const WORKER_DELAY_MS = 2000;

  const handleBulkScrape = async (sitesToScrape: SiteStatus[]) => {
    if (sitesToScrape.length === 0) {
      toast({ title: 'No sites to scrape', description: 'All sites in this category are already scraped.' });
      return;
    }

    cancelRef.current = false;
    setIsScraping(true);
    setActiveUrls([]);
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    let successCount = 0;
    let failCount = 0;
    let completedCount = 0;
    const total = sitesToScrape.length;
    let indexRef = 0;
    setBulkProgress({ current: 0, total, success: 0, failed: 0 });

    const worker = async () => {
      while (!cancelRef.current) {
        const i = indexRef++;
        if (i >= total) break;

        const site = sitesToScrape[i];
        const success = await scrapeSite(site);
        if (success) successCount++;
        else failCount++;
        completedCount++;

        setBulkProgress({ current: completedCount, total, success: successCount, failed: failCount });

        if (completedCount % 10 === 0) {
          loadSiteStatuses();
        }

        if (!cancelRef.current && indexRef < total) {
          await delay(WORKER_DELAY_MS);
        }
      }
    };

    await Promise.all(
      Array.from({ length: Math.min(CONCURRENCY, total) }, () => worker())
    );

    await loadSiteStatuses();
    setIsScraping(false);
    setActiveUrls([]);
    const wasCancelled = cancelRef.current;
    cancelRef.current = false;
    setBulkProgress({ current: 0, total: 0, success: 0, failed: 0 });
    toast({
      title: wasCancelled ? 'Bulk scrape stopped' : 'Bulk scrape complete',
      description: `Success: ${successCount}, Failed: ${failCount} out of ${total}`,
    });
  };

  // Validate URLs using edge function (server-side to avoid CORS)
  const handleValidateUrls = async () => {
    setIsValidating(true);
    setValidationProgress(0);
    
    const batchSize = 5;
    const updatedSites = [...sites];
    
    // Mark all as checking
    updatedSites.forEach((site, index) => {
      updatedSites[index] = { ...site, urlStatus: 'checking' };
    });
    setSites([...updatedSites]);

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    let autoRedirectCount = 0;
    
    for (let i = 0; i < updatedSites.length; i += batchSize) {
      const batch = updatedSites.slice(i, i + batchSize);
      const entries = batch.map(s => ({ url: s.url, name: s.name }));
      
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000);

        const response = await fetch(`${supabaseUrl}/functions/v1/validate-url`, {
          method: 'POST',
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey,
          },
          body: JSON.stringify({ entries }),
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
          console.error('Validation HTTP error:', response.status);
          batch.forEach(site => {
            const idx = updatedSites.findIndex(s => s.url === site.url);
            if (idx !== -1) {
              updatedSites[idx] = { ...updatedSites[idx], urlStatus: 'unknown', urlError: `HTTP ${response.status}` };
            }
          });
        } else {
          const data = await response.json();
          if (data?.results) {
            Object.entries(data.results).forEach(([url, result]: [string, Record<string, unknown>]) => {
              const idx = updatedSites.findIndex(s => s.url === url);
              if (idx !== -1) {
                let status: SiteStatus['urlStatus'] = 'valid';
                let wasAutoRedirected = false;
                if (!result.valid) status = 'invalid';
                else if (result.contentMatch === false) status = 'mismatch';
                else if (result.finalUrl) {
                  try {
                    const originalHost = new URL(url).hostname;
                    const finalHost = new URL(result.finalUrl as string).hostname;
                    if (originalHost !== finalHost) {
                      // Auto-apply the redirect
                      const overrides = loadUrlOverrides();
                      overrides[url] = result.finalUrl as string;
                      saveUrlOverrides(overrides);
                      updatedSites[idx] = {
                        ...updatedSites[idx],
                        url: result.finalUrl as string,
                        urlStatus: 'redirect',
                        urlError: undefined,
                        pageTitle: result.pageTitle as string | undefined,
                        finalUrl: result.finalUrl as string,
                      };
                      autoRedirectCount++;
                      wasAutoRedirected = true;
                    }
                  } catch { /* ignore parse errors */ }
                }

                if (!wasAutoRedirected) {
                  updatedSites[idx] = { 
                    ...updatedSites[idx], 
                    urlStatus: status,
                    urlError: result.error as string | undefined,
                    pageTitle: result.pageTitle as string | undefined,
                    finalUrl: result.finalUrl as string | undefined,
                  };
                }
              }
            });
          }
        }
      } catch (err) {
        console.error('Exception during validation:', err);
        batch.forEach(site => {
          const idx = updatedSites.findIndex(s => s.url === site.url);
          if (idx !== -1) {
            updatedSites[idx] = { ...updatedSites[idx], urlStatus: 'unknown', urlError: 'Request failed' };
          }
        });
      }
      
      setValidationProgress(Math.min(100, Math.round(((i + batchSize) / updatedSites.length) * 100)));
      setSites([...updatedSites]);
    }
    
    // Save validation results to localStorage
    const validationToSave: Record<string, ValidationResult> = {};
    updatedSites.forEach(s => {
      if (s.urlStatus && s.urlStatus !== 'checking') {
        validationToSave[s.url] = {
          urlStatus: s.urlStatus,
          urlError: s.urlError,
          pageTitle: s.pageTitle,
          finalUrl: s.finalUrl,
        };
      }
    });
    saveValidationResults(validationToSave);

    const invalidCount = updatedSites.filter(s => s.urlStatus === 'invalid').length;
    const mismatchCount = updatedSites.filter(s => s.urlStatus === 'mismatch').length;
    const unknownCount = updatedSites.filter(s => s.urlStatus === 'unknown').length;
    toast({
      title: 'URL Validation Complete',
      description: `${invalidCount} unreachable, ${mismatchCount} mismatches, ${autoRedirectCount} auto-corrected, ${unknownCount} unknown`,
      variant: (invalidCount + mismatchCount) > 0 ? 'destructive' : 'default',
    });
    
    setIsValidating(false);
    setValidationProgress(100);
  };

  // Filter sites based on search and tab
  const filteredSites = useMemo(() => {
    let filtered = sites;

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(s => 
        s.name.toLowerCase().includes(query) || 
        s.url.toLowerCase().includes(query) ||
        s.categoryName.toLowerCase().includes(query)
      );
    }

    // Apply tab filter
    switch (activeTab) {
      case 'not_scraped':
        filtered = filtered.filter(s => s.dbStatus === 'not_scraped');
        break;
      case 'success':
        filtered = filtered.filter(s => s.dbStatus === 'success');
        break;
      case 'failed':
        filtered = filtered.filter(s => s.dbStatus === 'failed');
        break;
      case 'incomplete':
        filtered = filtered.filter(s => s.dbStatus === 'incomplete' || (s.dbStatus === 'success' && (!s.hasDescription || !s.hasContact)));
        break;
      case 'unreachable':
        filtered = filtered.filter(s => s.urlStatus === 'invalid' || s.urlStatus === 'mismatch' || s.urlStatus === 'redirect');
        break;
      case 'unknown':
        filtered = filtered.filter(s => s.urlStatus === 'unknown');
        break;
    }

    return filtered;
  }, [sites, searchQuery, activeTab]);

  // Stats
  const stats = useMemo(() => ({
    total: sites.length,
    notScraped: sites.filter(s => s.dbStatus === 'not_scraped').length,
    success: sites.filter(s => s.dbStatus === 'success').length,
    failed: sites.filter(s => s.dbStatus === 'failed').length,
    incomplete: sites.filter(s => s.dbStatus === 'incomplete' || (s.dbStatus === 'success' && (!s.hasDescription || !s.hasContact))).length,
    withDescription: sites.filter(s => s.hasDescription).length,
    withContact: sites.filter(s => s.hasContact).length,
    withServices: sites.filter(s => s.hasServices).length,
    unreachable: sites.filter(s => s.urlStatus === 'invalid' || s.urlStatus === 'mismatch' || s.urlStatus === 'redirect').length,
    unknown: sites.filter(s => s.urlStatus === 'unknown').length,
  }), [sites]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto py-16 flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <Lock className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <CardTitle>Admin Access</CardTitle>
            <p className="text-sm text-muted-foreground">Enter password to access the dashboard</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (password === ADMIN_PASSWORD) {
                setIsAuthenticated(true);
              } else {
                toast({ title: 'Incorrect password', variant: 'destructive' });
                setPassword('');
              }
            }} className="space-y-4">
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
              />
              <Button type="submit" className="w-full">Unlock</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Site Dashboard</h1>
        <p className="text-muted-foreground">Manage and monitor all government website data</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Database className="h-4 w-4" />
            <span className="text-sm">Total</span>
          </div>
          <p className="text-2xl font-bold">{stats.total}</p>
        </Card>
        <Card className="p-4 border-green-200 bg-green-50/50 dark:bg-green-950/20">
          <div className="flex items-center gap-2 text-green-600 mb-1">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm">Scraped</span>
          </div>
          <p className="text-2xl font-bold text-green-700">{stats.success}</p>
        </Card>
        <Card className="p-4 border-yellow-200 bg-yellow-50/50 dark:bg-yellow-950/20">
          <div className="flex items-center gap-2 text-yellow-600 mb-1">
            <Clock className="h-4 w-4" />
            <span className="text-sm">Not Scraped</span>
          </div>
          <p className="text-2xl font-bold text-yellow-700">{stats.notScraped}</p>
        </Card>
        <Card className="p-4 border-red-200 bg-red-50/50 dark:bg-red-950/20">
          <div className="flex items-center gap-2 text-red-600 mb-1">
            <XCircle className="h-4 w-4" />
            <span className="text-sm">Failed</span>
          </div>
          <p className="text-2xl font-bold text-red-700">{stats.failed}</p>
        </Card>
        <Card className="p-4 border-orange-200 bg-orange-50/50 dark:bg-orange-950/20">
          <div className="flex items-center gap-2 text-orange-600 mb-1">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm">Incomplete</span>
          </div>
          <p className="text-2xl font-bold text-orange-700">{stats.incomplete}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Globe className="h-4 w-4" />
            <span className="text-sm">With Contact</span>
          </div>
          <p className="text-2xl font-bold">{stats.withContact}</p>
        </Card>
      </div>

      {/* Filters and Actions */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, URL, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            onClick={loadSiteStatuses}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            onClick={handleValidateUrls}
            disabled={isValidating || isScraping}
          >
            {isValidating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Validating ({validationProgress}%)
              </>
            ) : (
              <>
                <Globe className="h-4 w-4 mr-2" />
                Check URLs
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              const missing = filteredSites.filter(s => s.dbStatus !== 'success' && s.dbStatus !== 'in_progress' && s.urlStatus !== 'invalid');
              handleBulkScrape(missing);
            }}
            disabled={isScraping}
          >
            {isScraping ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Scraping...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Scrape Missing ({filteredSites.filter(s => s.dbStatus !== 'success' && s.dbStatus !== 'in_progress' && s.urlStatus !== 'invalid').length})
              </>
            )}
          </Button>
          <Button
            onClick={() => handleBulkScrape(sites)}
            disabled={isScraping}
            className="bg-primary"
          >
            {isScraping ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Scraping...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Re-Scrape All ({sites.length})
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Validation Progress */}
      {isValidating && (
        <div className="mb-6">
          <Progress value={validationProgress} className="h-2" />
          <p className="text-sm text-muted-foreground mt-1">Checking URL accessibility... {validationProgress}%</p>
        </div>
      )}

      {/* Bulk Scrape Progress */}
      {isScraping && bulkProgress.total > 0 && (
        <div className="mb-6 p-4 border rounded-lg bg-muted/30">
          <div className="flex justify-between text-sm mb-2">
            <span>Completed {bulkProgress.current} of {bulkProgress.total} ({activeUrls.length} active)</span>
            <span className="text-muted-foreground">
              {bulkProgress.success} success | {bulkProgress.failed} failed
            </span>
          </div>
          <Progress value={(bulkProgress.current / bulkProgress.total) * 100} className="h-2" />
          <div className="flex items-center justify-between mt-2">
            <div className="flex-1 min-w-0">
              {activeUrls.map(url => (
                <p key={url} className="text-xs text-muted-foreground truncate">
                  <Loader2 className="h-3 w-3 inline mr-1 animate-spin" />
                  {url}
                </p>
              ))}
            </div>
            <Button variant="destructive" size="sm" onClick={handleStopScrape} className="ml-2 shrink-0">
              <XCircle className="h-4 w-4 mr-1" /> Stop
            </Button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid grid-cols-7 w-full max-w-4xl">
          <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
          <TabsTrigger value="not_scraped">Not Scraped ({stats.notScraped})</TabsTrigger>
          <TabsTrigger value="success">Success ({stats.success})</TabsTrigger>
          <TabsTrigger value="failed">Failed ({stats.failed})</TabsTrigger>
          <TabsTrigger value="incomplete">Incomplete ({stats.incomplete})</TabsTrigger>
          <TabsTrigger value="unreachable" className="text-red-600">Unreachable ({stats.unreachable})</TabsTrigger>
          <TabsTrigger value="unknown" className="text-yellow-600">Unknown ({stats.unknown})</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Sites List */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Sites ({filteredSites.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {filteredSites.map((site) => (
              <div 
                key={site.url} 
                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1 min-w-0 mr-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Link 
                      to={`/directory/${getSiteSlug(site.url)}`}
                      className="font-medium hover:text-primary truncate"
                    >
                      {site.name}
                    </Link>
                    <Badge variant="outline" className="text-xs shrink-0">
                      {site.categoryName}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <a 
                      href={site.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 hover:text-primary truncate max-w-xs"
                    >
                      <Globe className="h-3 w-3 shrink-0" />
                      {site.url.replace('https://', '').replace('http://', '')}
                      <ExternalLink className="h-3 w-3 shrink-0" />
                    </a>
                    {site.lastScraped && (
                      <span className="flex items-center gap-1 shrink-0">
                        <Clock className="h-3 w-3" />
                        {formatDate(site.lastScraped)}
                      </span>
                    )}
                  </div>
                  {site.scrapeError && (
                    <p className="text-xs text-red-500 mt-1 truncate">{site.scrapeError}</p>
                  )}
                  {site.urlStatus === 'mismatch' && site.pageTitle && (
                    <p className="text-xs text-orange-500 mt-1 truncate">Page title: "{site.pageTitle}"</p>
                  )}
                  {site.urlStatus === 'redirect' && site.finalUrl && (
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-orange-500 truncate">Redirects to: {site.finalUrl}</p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 text-xs px-2 shrink-0"
                        onClick={() => handleAcceptRedirect(site.url, site.finalUrl!)}
                      >
                        <ArrowRight className="h-3 w-3 mr-1" />
                        Use This URL
                      </Button>
                    </div>
                  )}
                  {site.urlError && (site.urlStatus === 'invalid' || site.urlStatus === 'unknown') && (
                    <p className="text-xs text-red-500 mt-1 truncate">Error: {site.urlError}</p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Data indicators */}
                  <div className="flex gap-1">
                    <Badge 
                      variant={site.hasDescription ? "default" : "outline"} 
                      className={`text-xs ${site.hasDescription ? 'bg-green-600' : 'text-muted-foreground'}`}
                    >
                      Desc
                    </Badge>
                    <Badge 
                      variant={site.hasContact ? "default" : "outline"} 
                      className={`text-xs ${site.hasContact ? 'bg-green-600' : 'text-muted-foreground'}`}
                    >
                      Contact
                    </Badge>
                    <Badge 
                      variant={site.hasServices ? "default" : "outline"} 
                      className={`text-xs ${site.hasServices ? 'bg-green-600' : 'text-muted-foreground'}`}
                    >
                      Services
                    </Badge>
                  </div>

                  {/* URL Status indicator */}
                  {site.urlStatus === 'checking' && (
                    <Badge variant="outline" className="text-blue-500">
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      Checking
                    </Badge>
                  )}
                  {site.urlStatus === 'invalid' && (
                    <Badge variant="destructive" className="bg-red-700">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Unreachable
                    </Badge>
                  )}
                  {site.urlStatus === 'mismatch' && (
                    <Badge variant="destructive" className="bg-orange-600" title={`Page title: "${site.pageTitle}"`}>
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Mismatch
                    </Badge>
                  )}
                  {site.urlStatus === 'redirect' && (
                    <Badge variant="destructive" className="bg-orange-600" title={`Redirects to: ${site.finalUrl}`}>
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Redirect
                    </Badge>
                  )}
                  {site.urlStatus === 'unknown' && (
                    <Badge variant="outline" className="text-yellow-600 border-yellow-400">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Unknown
                    </Badge>
                  )}

                  {/* Scrape method badge */}
                  {site.scrapeMethod && (
                    <Badge variant="outline" className="text-xs text-muted-foreground" title={`Quality: ${Math.round((site.contentQuality || 0) * 100)}%`}>
                      {site.scrapeMethod === 'firecrawl_extract' ? 'Extract'
                        : site.scrapeMethod === 'firecrawl_json' ? 'FC JSON'
                        : site.scrapeMethod === 'firecrawl_json+gemini' ? 'FC+Gem'
                        : site.scrapeMethod === 'firecrawl_markdown+gemini' ? 'FC MD+Gem'
                        : site.scrapeMethod === 'firecrawl_json_partial' ? 'FC Partial'
                        : site.scrapeMethod === 'direct_fetch+gemini' ? 'Direct+Gem'
                        : site.scrapeMethod === 'http_fallback+gemini' ? 'HTTP+Gem'
                        : site.scrapeMethod === 'google_cache+gemini' ? 'Cache+Gem'
                        : site.scrapeMethod === 'wayback_archive+gemini' ? 'Wayback+Gem'
                        : site.scrapeMethod === 'firecrawl+perplexity' ? 'FC+PPX'
                        : site.scrapeMethod === 'perplexity_only' ? 'PPX'
                        : site.scrapeMethod === 'firecrawl_scrape' ? 'Scrape'
                        : site.scrapeMethod}
                    </Badge>
                  )}

                  {/* Status badge */}
                  {site.dbStatus === 'not_scraped' && (
                    <Badge variant="outline" className="text-yellow-600">Not Scraped</Badge>
                  )}
                  {site.dbStatus === 'success' && (
                    <Badge className="bg-green-600">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Success
                    </Badge>
                  )}
                  {site.dbStatus === 'incomplete' && (
                    <Badge className="bg-amber-500">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Incomplete
                    </Badge>
                  )}
                  {site.dbStatus === 'failed' && (
                    <Badge variant="destructive">
                      <XCircle className="h-3 w-3 mr-1" />
                      Failed
                    </Badge>
                  )}
                  {(site.dbStatus === 'pending' || site.dbStatus === 'in_progress') && (
                    <Badge variant="outline" className="text-blue-600">
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      In Progress
                    </Badge>
                  )}

                  {/* Scrape button */}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSingleScrape(site)}
                    disabled={isScraping}
                  >
                    {activeUrls.includes(site.url) ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))}

            {filteredSites.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No sites match your filters</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
