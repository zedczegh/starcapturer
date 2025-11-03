
import React from 'react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { BadgeCheck, MapPin, Eye, Mountain } from 'lucide-react';

export type PhotoPointsViewMode = 'certified' | 'calculated' | 'obscura' | 'mountains';

interface ViewToggleProps {
  activeView: PhotoPointsViewMode;
  onViewChange: (view: PhotoPointsViewMode) => void;
  loading?: boolean;
}

const ViewToggle: React.FC<ViewToggleProps> = ({
  activeView,
  onViewChange,
  loading = false
}) => {
  const { t } = useLanguage();
  
  // Simplified view change handler without unnecessary checks
  const handleViewChange = (view: PhotoPointsViewMode) => {
    if (view !== activeView) {
      console.log(`ViewToggle: Switching to ${view} view`);
      onViewChange(view);
    }
  };
  
  const viewTypes = [
    { value: 'certified' as const, label: t("Dark Sky Locations", "暗夜天空位置"), icon: BadgeCheck },
    { value: 'calculated' as const, label: t("Recommended Near Me", "附近推荐"), icon: MapPin },
    { value: 'obscura' as const, label: t("Obscura Locations", "奇观位置"), icon: Eye },
    { value: 'mountains' as const, label: t("Natural Locations", "自然位置"), icon: Mountain },
  ];

  return (
    <div className="flex flex-wrap gap-2 justify-center mb-6 px-4">
      {viewTypes.map(({ value, label, icon: Icon }) => (
        <Button
          key={value}
          variant={activeView === value ? "default" : "outline"}
          size="sm"
          onClick={() => handleViewChange(value)}
          disabled={loading || activeView === value}
          className="transition-all"
        >
          <Icon className="mr-2 h-4 w-4" />
          {label}
        </Button>
      ))}
    </div>
  );
};

export default ViewToggle;
