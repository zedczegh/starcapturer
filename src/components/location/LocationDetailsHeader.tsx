
import React from 'react';
import { Clock, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

interface LocationDetailsHeaderProps {
  name: string;
  timestamp?: number | null;
  onRefresh: () => void;
  loading: boolean;
  className?: string;
}

const LocationDetailsHeader: React.FC<LocationDetailsHeaderProps> = ({
  name,
  timestamp,
  onRefresh,
  loading,
  className = ''
}) => {
  const { t } = useLanguage();
  
  const formatTimestamp = () => {
    if (!timestamp) return null;
    
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return null;
    }
  };
  
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <h1 className="text-2xl md:text-3xl font-bold text-gradient-cosmic">{name}</h1>
      
      <div className="flex items-center mt-2 text-sm text-muted-foreground">
        {timestamp && (
          <div className="flex items-center">
            <Clock className="h-3.5 w-3.5 mr-1" />
            <span>{t("Updated", "更新于")}: {formatTimestamp()}</span>
          </div>
        )}
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onRefresh}
          disabled={loading}
          className="ml-2 text-muted-foreground hover:text-primary"
        >
          <RefreshCw className={`h-3.5 w-3.5 mr-1 ${loading ? 'animate-spin' : ''}`} />
          <span>{t("Refresh", "刷新")}</span>
        </Button>
      </div>
    </div>
  );
};

export default LocationDetailsHeader;
