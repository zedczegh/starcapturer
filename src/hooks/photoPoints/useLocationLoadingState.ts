
import { useState, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

export const useLocationLoadingState = () => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);

  const startLoading = useCallback(() => {
    setLoading(true);
  }, []);

  const stopLoading = useCallback((hasMoreLocations: boolean = false) => {
    setLoading(false);
    setHasMore(hasMoreLocations);
  }, []);

  const startSearching = useCallback(() => {
    setSearching(true);
  }, []);

  const stopSearching = useCallback(() => {
    setSearching(false);
  }, []);

  const incrementPage = useCallback(() => {
    setPage(prev => prev + 1);
  }, []);

  const resetPage = useCallback(() => {
    setPage(1);
  }, []);

  const handleError = useCallback((errorMessage: string) => {
    toast.error(t(errorMessage, errorMessage));
    stopLoading();
    stopSearching();
  }, [t, stopLoading, stopSearching]);

  return {
    loading,
    searching,
    hasMore,
    page,
    startLoading,
    stopLoading,
    startSearching,
    stopSearching,
    incrementPage,
    resetPage,
    handleError
  };
};
