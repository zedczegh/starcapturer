
import { useState, useEffect } from 'react';
import { fetchAstronomyData, clearAstronomyDataCache } from '@/utils/astronomy/dataFetcher';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

interface AstronomyDataOptions {
  cacheDuration?: number;
  errorRetries?: number;
  retryDelay?: number;
  showToasts?: boolean;
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}

export function useAstronomyDataFetcher<T>(
  url: string | null,
  options: AstronomyDataOptions = {}
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const { t } = useLanguage();
  
  const {
    cacheDuration = 30 * 60 * 1000, // 30 minutes default
    errorRetries = 2,
    retryDelay = 1000,
    showToasts = false,
    onSuccess,
    onError
  } = options;
  
  // Function to fetch data with retries
  const fetchData = async (retryCount = 0) => {
    if (!url) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await fetchAstronomyData<T>(url, undefined, cacheDuration);
      setData(result);
      setLoading(false);
      
      if (onSuccess) onSuccess(result);
    } catch (err) {
      console.error('Error fetching astronomy data:', err);
      
      // Retry logic
      if (retryCount < errorRetries) {
        const delay = retryDelay * Math.pow(2, retryCount);
        console.log(`Retrying fetch (${retryCount + 1}/${errorRetries}) in ${delay}ms...`);
        
        setTimeout(() => {
          fetchData(retryCount + 1);
        }, delay);
        return;
      }
      
      setError(err instanceof Error ? err : new Error('Failed to fetch astronomy data'));
      setLoading(false);
      
      if (showToasts) {
        toast.error(t('Failed to load astronomy data', '加载天文数据失败'));
      }
      
      if (onError) onError(err instanceof Error ? err : new Error('Failed to fetch astronomy data'));
    }
  };
  
  // Effect to fetch data when URL changes
  useEffect(() => {
    if (url) {
      fetchData();
    } else {
      setData(null);
    }
    
    return () => {
      // Cleanup if needed
    };
  }, [url]);
  
  const refetch = () => {
    fetchData();
  };
  
  const clearCache = () => {
    if (url) {
      clearAstronomyDataCache();
      fetchData();
    }
  };
  
  return {
    data,
    loading,
    error,
    refetch,
    clearCache
  };
}
