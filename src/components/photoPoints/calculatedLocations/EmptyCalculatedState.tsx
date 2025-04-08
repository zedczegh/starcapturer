
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { RefreshCcw, MapPin } from 'lucide-react';

interface EmptyCalculatedStateProps {
  searchRadius?: number;
  onRefresh?: () => void;
}

const EmptyCalculatedState: React.FC<EmptyCalculatedStateProps> = ({ 
  searchRadius = 0,
  onRefresh 
}) => {
  const { t } = useLanguage();
  
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
      <div className="bg-background/50 p-4 rounded-full">
        <MapPin className="h-8 w-8 text-primary/60" />
      </div>
      
      <h3 className="text-lg font-medium">
        {t("No calculated locations found", "未找到计算位置")}
      </h3>
      
      <p className="text-sm text-muted-foreground max-w-md">
        {searchRadius > 0 ? (
          t(
            `We couldn't find any good astronomy locations within ${searchRadius}km of your position.`, 
            `我们无法在您位置的 ${searchRadius}公里范围内找到任何好的天文位置。`
          )
        ) : (
          t(
            "We couldn't find any good astronomy locations nearby.",
            "我们无法在附近找到任何好的天文位置。"
          )
        )}
      </p>
      
      <div className="flex space-x-4">
        <Button 
          variant="outline" 
          onClick={onRefresh}
          disabled={!onRefresh}
          className="flex items-center space-x-2"
        >
          <RefreshCcw className="h-4 w-4 mr-2" />
          {t("Refresh", "刷新")}
        </Button>
      </div>
    </div>
  );
};

export default EmptyCalculatedState;
