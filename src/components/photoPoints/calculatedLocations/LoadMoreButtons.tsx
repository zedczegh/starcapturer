
import React from 'react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { Loader2 } from 'lucide-react';

interface LoadMoreButtonsProps {
  hasMore: boolean;
  onLoadMore: () => void;
  canLoadMoreCalculated?: boolean;
  onLoadMoreCalculated?: () => void;
  loading?: boolean;
}

const LoadMoreButtons: React.FC<LoadMoreButtonsProps> = ({
  hasMore,
  onLoadMore,
  canLoadMoreCalculated = false,
  onLoadMoreCalculated,
  loading = false
}) => {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col sm:flex-row justify-center gap-3 mt-4 mb-8">
      {hasMore && (
        <Button 
          variant="default" 
          onClick={onLoadMore}
          disabled={loading}
          className="min-w-[180px]"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("Loading...", "加载中...")}
            </>
          ) : (
            t("Load More Locations", "加载更多位置")
          )}
        </Button>
      )}
      
      {canLoadMoreCalculated && onLoadMoreCalculated && (
        <Button
          variant="secondary"
          onClick={onLoadMoreCalculated}
          disabled={loading}
          className="min-w-[180px]"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("Loading...", "加载中...")}
            </>
          ) : (
            t("Calculate More Spots", "计算更多位置")
          )}
        </Button>
      )}
    </div>
  );
};

export default LoadMoreButtons;
