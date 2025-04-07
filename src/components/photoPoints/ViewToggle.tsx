
import React, { useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Star, PenLine, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
  certifiedCount = 0,
  calculatedCount = 0,
  loading = false
}) => {
  const { t } = useLanguage();

  const counters = useMemo(() => {
    return {
      certified: loading ? '...' : certifiedCount,
      calculated: loading ? '...' : calculatedCount
    };
  }, [certifiedCount, calculatedCount, loading]);

  return (
    <div className="view-type-toggles mb-6">
      <div className="inline-flex rounded-lg border border-border overflow-hidden shadow-sm">
        <Button
          variant={activeView === 'certified' ? 'default' : 'outline'}
          size="default"
          className={`rounded-none border-0 ${activeView === 'certified' ? 'font-medium' : 'font-normal'} px-5`}
          onClick={() => onViewChange('certified')}
        >
          <Star 
            className={`w-4 h-4 mr-2 ${activeView === 'certified' ? 'fill-primary-foreground' : ''}`} 
          />
          {t("Certified Dark Skies", "认证黑夜空")}
          <span className="ml-2 opacity-90 text-sm">({counters.certified})</span>
        </Button>
        
        <Button
          variant={activeView === 'calculated' ? 'default' : 'outline'}
          size="default"
          className={`rounded-none border-0 ${activeView === 'calculated' ? 'font-medium' : 'font-normal'} px-5`}
          onClick={() => onViewChange('calculated')}
        >
          <PenLine className="w-4 h-4 mr-2" />
          {t("Calculated Spots", "计算位置")}
          <span className="ml-2 opacity-90 text-sm">({counters.calculated})</span>
        </Button>
      </div>

      {loading && (
        <div className="mt-2 flex items-center justify-center text-sm text-muted-foreground">
          <Loader2 className="w-3 h-3 mr-2 animate-spin" />
          {t("Updating locations...", "正在更新位置...")}
        </div>
      )}
    </div>
  );
};

export default ViewToggle;
