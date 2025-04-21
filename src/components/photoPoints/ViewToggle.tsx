
import React, { useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface ViewToggleProps {
  activeView: 'certified' | 'calculated';
  onViewChange: (view: 'certified' | 'calculated') => void;
  loading?: boolean;
  disabled?: boolean;
}

const ViewToggle: React.FC<ViewToggleProps> = ({ 
  activeView, 
  onViewChange,
  loading = false,
  disabled = false
}) => {
  const { t } = useLanguage();

  // Memoize button props to prevent recalculating on every render
  const certifiedButtonProps = useMemo(() => {
    const isCertifiedActive = activeView === 'certified';
    return {
      className: `flex-1 py-2 rounded-l-md transition-colors duration-200 ${
        isCertifiedActive
          ? 'bg-primary text-primary-foreground ring-2 ring-primary-foreground ring-inset'
          : 'bg-background text-muted-foreground border border-border hover:bg-muted'
      }`,
      disabled: disabled || (isCertifiedActive && loading)
    };
  }, [activeView, loading, disabled]);
  
  const calculatedButtonProps = useMemo(() => {
    const isCalculatedActive = activeView === 'calculated';
    return {
      className: `flex-1 py-2 rounded-r-md transition-colors duration-200 ${
        isCalculatedActive
          ? 'bg-primary text-primary-foreground ring-2 ring-primary-foreground ring-inset'
          : 'bg-background text-muted-foreground border border-border hover:bg-muted'
      }`,
      disabled: disabled || (isCalculatedActive && loading)
    };
  }, [activeView, loading, disabled]);

  return (
    <div className="max-w-xl mx-auto mb-6">
      <div className="text-center text-sm text-muted-foreground mb-2">
        {t("View mode", "查看模式")}
      </div>
      <div className="flex">
        <Button
          {...certifiedButtonProps}
          onClick={() => onViewChange('certified')}
          type="button"
        >
          {loading && activeView === 'certified' ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : null}
          {t("Certified Locations", "认证地点")}
        </Button>
        <Button
          {...calculatedButtonProps}
          onClick={() => onViewChange('calculated')}
          type="button"
        >
          {loading && activeView === 'calculated' ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : null}
          {t("Calculated Spots", "计算位置")}
        </Button>
      </div>
    </div>
  );
};

export default React.memo(ViewToggle);
