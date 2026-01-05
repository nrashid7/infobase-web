import { useState, useEffect, useMemo } from 'react';
import { govDirectory } from '@/data/govDirectory';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Loader2, Play, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SiteToScrape {
  name: string;
  url: string;
  categoryId: string;
  status: 'pending' | 'scraping' | 'success' | 'failed';
  error?: string;
}

export default function BulkScrape() {
  const { toast } = useToast();
  const [sites, setSites] = useState<SiteToScrape[]>([]);
  const [scrapedUrls, setScrapedUrls] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isScraping, setIsScraping] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Get all sites from directory - memoized to avoid recreation
  const allSites = useMemo(() => govDirectory.flatMap(cat => 
    cat.links.map(link => ({
      name: link.name,
      url: link.url,
      categoryId: cat.id,
      status: 'pending' as const
    }))
  ), []);

  // Load already scraped sites from database
  useEffect(() => {
    async function loadScrapedSites() {
      try {
        const { data, error } = await supabase
          .from('gov_site_details')
          .select('url, scrape_status');
        
        if (error) {
          console.error('Error loading scraped sites:', error);
          setIsLoading(false);
          return;
        }

        const successUrls = new Set(
          (data || [])
            .filter(site => site.scrape_status === 'success')
            .map(site => site.url)
        );
        
        setScrapedUrls(successUrls);
        
        // Filter to only unscraped sites - normalize URLs for comparison
        const unscraped = allSites.filter(site => {
          // Check both with and without trailing slash
          const urlWithSlash = site.url.endsWith('/') ? site.url : site.url + '/';
          const urlWithoutSlash = site.url.endsWith('/') ? site.url.slice(0, -1) : site.url;
          return !successUrls.has(site.url) && !successUrls.has(urlWithSlash) && !successUrls.has(urlWithoutSlash);
        });
        
        console.log(`Total sites: ${allSites.length}, Already scraped: ${successUrls.size}, Remaining: ${unscraped.length}`);
        setSites(unscraped);
      } catch (err) {
        console.error('Exception loading scraped sites:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadScrapedSites();
  }, [allSites]);

  const scrapeSite = async (site: SiteToScrape): Promise<boolean> => {
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
    }
  };

  const startBulkScrape = async () => {
    if (sites.length === 0) {
      toast({ title: 'All sites already scraped', description: 'No new sites to scrape.' });
      return;
    }

    setIsScraping(true);
    setCurrentIndex(0);

    // Scrape 3 sites at a time with delay between batches
    const batchSize = 3;
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    for (let i = 0; i < sites.length; i += batchSize) {
      const batch = sites.slice(i, i + batchSize);
      
      // Mark batch as scraping
      setSites(prev => prev.map((site, idx) => 
        idx >= i && idx < i + batchSize 
          ? { ...site, status: 'scraping' } 
          : site
      ));

      // Scrape batch in parallel
      const results = await Promise.all(
        batch.map(async (site, batchIdx) => {
          const success = await scrapeSite(site);
          return { index: i + batchIdx, success };
        })
      );

      // Update statuses
      setSites(prev => prev.map((site, idx) => {
        const result = results.find(r => r.index === idx);
        if (result) {
          return { ...site, status: result.success ? 'success' : 'failed' };
        }
        return site;
      }));

      setCurrentIndex(Math.min(i + batchSize, sites.length));

      // Wait between batches to avoid rate limiting
      if (i + batchSize < sites.length) {
        await delay(2000);
      }
    }

    setIsScraping(false);
    
    const successCount = sites.filter((_, idx) => {
      const site = sites[idx];
      return site.status === 'success';
    }).length;

    toast({
      title: 'Bulk scrape complete',
      description: `Successfully scraped ${successCount} of ${sites.length} sites.`
    });
  };

  const retryFailed = async () => {
    const failedSites = sites.filter(s => s.status === 'failed');
    if (failedSites.length === 0) return;

    // Reset failed to pending and start again
    setSites(prev => prev.map(site => 
      site.status === 'failed' ? { ...site, status: 'pending' } : site
    ));

    // Filter to only retry failed ones
    const failedIndices = sites.map((s, i) => s.status === 'failed' ? i : -1).filter(i => i !== -1);
    
    setIsScraping(true);
    
    for (const idx of failedIndices) {
      const site = sites[idx];
      setSites(prev => prev.map((s, i) => i === idx ? { ...s, status: 'scraping' } : s));
      
      const success = await scrapeSite(site);
      
      setSites(prev => prev.map((s, i) => 
        i === idx ? { ...s, status: success ? 'success' : 'failed' } : s
      ));

      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    setIsScraping(false);
  };

  const successCount = sites.filter(s => s.status === 'success').length;
  const failedCount = sites.filter(s => s.status === 'failed').length;
  const pendingCount = sites.filter(s => s.status === 'pending').length;
  const scrapingCount = sites.filter(s => s.status === 'scraping').length;
  const progress = sites.length > 0 ? ((successCount + failedCount) / sites.length) * 100 : 0;

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Bulk Scrape Government Sites</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Total: {allSites.length}</Badge>
              <Badge variant="default" className="bg-green-600">Already Scraped: {scrapedUrls.size}</Badge>
              <Badge variant="outline">Remaining: {sites.length}</Badge>
            </div>

            {sites.length > 0 && (
              <>
                <Progress value={progress} className="h-3" />
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="text-green-600">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Success: {successCount}
                  </Badge>
                  <Badge variant="outline" className="text-red-600">
                    <XCircle className="h-3 w-3 mr-1" />
                    Failed: {failedCount}
                  </Badge>
                  <Badge variant="outline">Pending: {pendingCount}</Badge>
                  {scrapingCount > 0 && (
                    <Badge variant="outline" className="text-blue-600">
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      Scraping: {scrapingCount}
                    </Badge>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={startBulkScrape} 
                    disabled={isScraping || pendingCount === 0}
                  >
                    {isScraping ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Scraping...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Start Bulk Scrape ({pendingCount} sites)
                      </>
                    )}
                  </Button>
                  
                  {failedCount > 0 && !isScraping && (
                    <Button variant="outline" onClick={retryFailed}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Retry Failed ({failedCount})
                    </Button>
                  )}
                </div>
              </>
            )}

            {sites.length === 0 && (
              <p className="text-muted-foreground">All sites have been successfully scraped!</p>
            )}
          </div>
        </CardContent>
      </Card>

      {sites.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Sites to Scrape ({sites.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {sites.map((site, idx) => (
                <div 
                  key={site.url} 
                  className="flex items-center justify-between p-2 rounded border"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{site.name}</p>
                    <p className="text-sm text-muted-foreground truncate">{site.url}</p>
                  </div>
                  <div className="ml-2">
                    {site.status === 'pending' && (
                      <Badge variant="outline">Pending</Badge>
                    )}
                    {site.status === 'scraping' && (
                      <Badge variant="outline" className="text-blue-600">
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        Scraping
                      </Badge>
                    )}
                    {site.status === 'success' && (
                      <Badge className="bg-green-600">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Success
                      </Badge>
                    )}
                    {site.status === 'failed' && (
                      <Badge variant="destructive">
                        <XCircle className="h-3 w-3 mr-1" />
                        Failed
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
