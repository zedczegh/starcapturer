import React, { useState, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

interface RefreshButtonProps {
  onRefresh: () => void;
  label?: string;
  className?: string;
}

const RefreshButton: React.FC<RefreshButtonProps> = ({ 
  onRefresh, 
  label,
  className = '' 
}) => {
  const { t } = useLanguage();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastClick, setLastClick] = useState(0);

  const handleDoubleClick = useCallback(() => {
    const now = Date.now();
    const timeSinceLastClick = now - lastClick;

    // Double click detection (within 500ms)
    if (timeSinceLastClick < 500 && timeSinceLastClick > 0) {
      setIsRefreshing(true);
      toast.info(
        t("Refreshing data...", "刷新数据中..."),
        { duration: 2000 }
      );
      
      onRefresh();
      
      setTimeout(() => {
        setIsRefreshing(false);
        toast.success(
          t("Data refreshed", "数据已刷新"),
          { duration: 2000 }
        );
      }, 1000);
    }
    
    setLastClick(now);
  }, [lastClick, onRefresh, t]);

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleDoubleClick}
      className={`${className} ${isRefreshing ? 'pointer-events-none' : ''}`}
      title={t("Double-click to refresh", "双击刷新")}
    >
      <RefreshCw 
        className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} 
      />
      {label && <span className="ml-2">{label}</span>}
    </Button>
  );
};

export default RefreshButton;
