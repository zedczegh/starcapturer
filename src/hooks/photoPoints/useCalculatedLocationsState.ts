
import { useState, useCallback } from 'react';
import { MAX_LOAD_MORE_CLICKS } from '@/utils/constants';

export const useCalculatedLocationsState = () => {
  const [canLoadMoreCalculated, setCanLoadMoreCalculated] = useState(false);
  const [loadMoreClickCount, setLoadMoreClickCount] = useState(0);

  const incrementLoadMoreClicks = useCallback(() => {
    setLoadMoreClickCount(prev => {
      const newCount = prev + 1;
      if (newCount >= MAX_LOAD_MORE_CLICKS) {
        setCanLoadMoreCalculated(false);
      }
      return newCount;
    });
  }, []);

  const resetLoadMoreState = useCallback(() => {
    setLoadMoreClickCount(0);
    setCanLoadMoreCalculated(true);
  }, []);

  return {
    canLoadMoreCalculated,
    loadMoreClickCount,
    maxLoadMoreClicks: MAX_LOAD_MORE_CLICKS,
    incrementLoadMoreClicks,
    resetLoadMoreState,
    setCanLoadMoreCalculated
  };
};
