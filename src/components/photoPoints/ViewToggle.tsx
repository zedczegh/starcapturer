
import React from 'react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { Sparkles, MapPin } from 'lucide-react';

export type PhotoPointsViewMode = 'certified' | 'calculated';

interface ViewToggleProps {
  activeView: PhotoPointsViewMode;
  onViewChange: (view: PhotoPointsViewMode) => void;
  certifiedCount: number;
  calculatedCount: number;
  loading?: boolean;
}

const ViewToggle: React.FC<ViewToggleProps> = ({
  activeView,
  onViewChange,
  certifiedCount,
  calculatedCount,
  loading = false
}) => {
  const { t } = useLanguage();
  
  return (
    <div className="flex justify-center md:justify-start mb-6">
      <div className="inline-flex bg-muted/30 p-1.5 rounded-lg shadow-sm border border-border/50">
        <Button
          variant={activeView === 'certified' ? "default" : "ghost"}
          size="sm"
          onClick={() => onViewChange('certified')}
          className={`relative flex justify-center items-center min-w-[145px] mr-2 py-1 ${
            activeView === 'certified'
              ? 'bg-gradient-to-r from-amber-500/90 to-amber-600/90 text-primary-foreground hover:from-amber-500/100 hover:to-amber-600/100'
              : 'text-muted-foreground hover:text-foreground hover:bg-background/90'
          }`}
        >
          <Sparkles className="h-4 w-4 mr-2" />
          <span>
            {t("Certified Dark Skies", "认证暗夜区")}
          </span>
          {typeof certifiedCount === 'number' && (
            <div className="absolute -top-2 -right-2 bg-primary rounded-full w-5 h-5 text-[10px] flex items-center justify-center z-10 text-primary-foreground font-medium">
              {certifiedCount}
            </div>
          )}
        </Button>
        
        <Button
          variant={activeView === 'calculated' ? "default" : "ghost"}
          size="sm"
          onClick={() => onViewChange('calculated')}
          className={`relative flex justify-center items-center min-w-[145px] py-1 ${
            activeView === 'calculated'
              ? 'bg-gradient-to-r from-primary/90 to-primary-dark/90 text-primary-foreground hover:from-primary hover:to-primary-dark'
              : 'text-muted-foreground hover:text-foreground hover:bg-background/90'
          }`}
        >
          <MapPin className="h-4 w-4 mr-2" />
          <span>
            {t("Calculated Spots", "计算位置")}
          </span>
          {typeof calculatedCount === 'number' && (
            <div className="absolute -top-2 -right-2 bg-primary rounded-full w-5 h-5 text-[10px] flex items-center justify-center z-10 text-primary-foreground font-medium">
              {calculatedCount}
            </div>
          )}
        </Button>
      </div>
    </div>
  );
};

export default ViewToggle;
