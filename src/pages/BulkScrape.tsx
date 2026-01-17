import { useState, useEffect, useMemo } from 'react';
import { govDirectory } from '@/data/govDirectory';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircle, XCircle, Loader2, Play, RefreshCw, Search, 
  Clock, AlertTriangle, Globe, Filter, Database, ExternalLink
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import { getSiteSlug } from '@/lib/api/govSites';

interface SiteStatus {
  name: string;
  url: string;
  categoryId: string;
  categoryName: string;
  dbStatus: 'not_scraped' | 'pending' | 'in_progress' | 'success' | 'failed';
  lastScraped?: string;
  hasDescription: boolean;
  hasContact: boolean;
  hasServices: boolean;
  scrapeError?: string;
}

export default function BulkScrape() {
  const { toast } = useToast();
  const [sites, setSites] = useState<SiteStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isScraping, setIsScraping] = useState(false);
  const [scrapingUrl, setScrapingUrl] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

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
        .select('url, scrape_status, last_scraped_at, description, contact_info, services, scrape_error');
      
      if (error) {
        console.error('Error loading site statuses:', error);
        return;
      }

      const dbMap = new Map(dbSites?.map(s => [s.url, s]) || []);

      const siteStatuses: SiteStatus[] = allDirectorySites.map(site => {
        const dbEntry = dbMap.get(site.url);
        
        return {
          ...site,
          dbStatus: dbEntry?.scrape_status as SiteStatus['dbStatus'] || 'not_scraped',
          lastScraped: dbEntry?.last_scraped_at || undefined,
          hasDescription: !!dbEntry?.description,
          hasContact: !!(dbEntry?.contact_info && Object.keys(dbEntry.contact_info as object).length > 0),
          hasServices: !!(dbEntry?.services && Array.isArray(dbEntry.services) && (dbEntry.services as unknown[]).length > 0),
          scrapeError: dbEntry?.scrape_error || undefined,
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
    loadSiteStatuses();
  }, []);

  const scrapeSite = async (site: SiteStatus): Promise<boolean> => {
    setScrapingUrl(site.url);
    try {
      const { data, error } = await supabase.functions.invoke('scrape-gov-site', {
        body: { url: site.url, name: site.name, categoryId: site.categoryId },
      });

      if (error) {
        console.error(`Error scraping ${site.name}:`, error);
        return false;
      }

      return data?.success || false;
    } catch (err) {
      console.error(`Exception scraping ${site.name}:`, err);
      return false;
    } finally {
      setScrapingUrl(null);
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

  const handleBulkScrape = async (sitesToScrape: SiteStatus[]) => {
    if (sitesToScrape.length === 0) {
      toast({ title: 'No sites to scrape', description: 'All sites in this category are already scraped.' });
      return;
    }

    setIsScraping(true);
    const batchSize = 2;
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < sitesToScrape.length; i += batchSize) {
      const batch = sitesToScrape.slice(i, i + batchSize);
      
      const results = await Promise.all(batch.map(site => scrapeSite(site)));
      
      results.forEach(success => {
        if (success) successCount++;
        else failCount++;
      });

      // Refresh statuses after each batch
      await loadSiteStatuses();

      if (i + batchSize < sitesToScrape.length) {
        await delay(3000);
      }
    }

    setIsScraping(false);
    toast({
      title: 'Bulk scrape complete',
      description: `Success: ${successCount}, Failed: ${failCount}`,
    });
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
        filtered = filtered.filter(s => s.dbStatus === 'success' && (!s.hasDescription || !s.hasContact));
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
    incomplete: sites.filter(s => s.dbStatus === 'success' && (!s.hasDescription || !s.hasContact)).length,
    withDescription: sites.filter(s => s.hasDescription).length,
    withContact: sites.filter(s => s.hasContact).length,
    withServices: sites.filter(s => s.hasServices).length,
  }), [sites]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

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
            onClick={() => handleBulkScrape(filteredSites.filter(s => s.dbStatus !== 'success'))}
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
                Scrape Missing ({filteredSites.filter(s => s.dbStatus !== 'success').length})
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

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid grid-cols-5 w-full max-w-2xl">
          <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
          <TabsTrigger value="not_scraped">Not Scraped ({stats.notScraped})</TabsTrigger>
          <TabsTrigger value="success">Success ({stats.success})</TabsTrigger>
          <TabsTrigger value="failed">Failed ({stats.failed})</TabsTrigger>
          <TabsTrigger value="incomplete">Incomplete ({stats.incomplete})</TabsTrigger>
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
                    {scrapingUrl === site.url ? (
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
