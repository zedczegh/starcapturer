
import React from 'react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { ChevronDown, Calculator, Loader2 } from 'lucide-react';

interface LoadMoreButtonsProps {
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onLoadMoreCalculated?: () => void;
  canLoadMoreCalculated?: boolean;
  loadMoreClickCount?: number;
  maxLoadMoreClicks?: number;
}

const LoadMoreButtons: React.FC<LoadMoreButtonsProps> = ({
  loading,
  hasMore,
  onLoadMore,
  onLoadMoreCalculated,
  canLoadMoreCalculated = false,
  loadMoreClickCount = 0,
  maxLoadMoreClicks = 2
}) => {
  const { t } = useLanguage();
  
  return (
    <div className="mt-6 flex flex-col items-center justify-center space-y-3">
      {hasMore && (
        <Button
          variant="outline"
          onClick={onLoadMore}
          disabled={loading}
          className="w-full sm:w-auto"
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <ChevronDown className="mr-2 h-4 w-4" />
          )}
          {t("Load More Locations", "加载更多位置")}
        </Button>
      )}
      
      {onLoadMoreCalculated && canLoadMoreCalculated && (
        <Button
          variant="default"
          onClick={onLoadMoreCalculated}
          disabled={loading}
          className="w-full sm:w-auto bg-gradient-to-r from-green-500/80 to-blue-500/80"
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Calculator className="mr-2 h-4 w-4" />
          )}
          {t(
            `Calculate More Spots (${loadMoreClickCount}/${maxLoadMoreClicks})`,
            `计算更多位置 (${loadMoreClickCount}/${maxLoadMoreClicks})`
          )}
        </Button>
      )}
    </div>
  );
};

export default LoadMoreButtons;
