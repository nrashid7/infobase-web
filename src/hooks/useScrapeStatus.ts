import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ScrapeStatusMap {
  [url: string]: 'success' | 'pending' | 'failed' | null;
}

export function useScrapeStatus() {
  const [statusMap, setStatusMap] = useState<ScrapeStatusMap>({});
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ success: 0, pending: 0, failed: 0 });

  useEffect(() => {
    async function fetchStatuses() {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('gov_site_details')
          .select('url, scrape_status');

        if (error) throw error;

        const map: ScrapeStatusMap = {};
        let success = 0, pending = 0, failed = 0;

        data?.forEach((item) => {
          const status = item.scrape_status as 'success' | 'pending' | 'failed' | null;
          map[item.url] = status;
          
          if (status === 'success') success++;
          else if (status === 'failed') failed++;
          else pending++;
        });

        setStatusMap(map);
        setStats({ success, pending, failed });
      } catch (error) {
        console.error('Error fetching scrape statuses:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchStatuses();
  }, []);

  const getStatus = (url: string) => statusMap[url] || null;

  return { statusMap, getStatus, isLoading, stats };
}
