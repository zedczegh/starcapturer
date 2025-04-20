
import React from 'react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { Filter, ListFilter } from 'lucide-react';

export type LocationListFilter = 'all' | 'certified' | 'calculated';

interface ViewToggleProps {
  activeFilter: LocationListFilter;
  onFilterChange: (filter: LocationListFilter) => void;
  loading?: boolean;
}

const ViewToggle: React.FC<ViewToggleProps> = ({
  activeFilter,
  onFilterChange,
  loading = false
}) => {
  const { t } = useLanguage();
  
  const handleFilterChange = (filter: LocationListFilter) => {
    if (filter !== activeFilter && !loading) {
      console.log(`ViewToggle: Switching to ${filter} filter`);
      onFilterChange(filter);
    }
  };
  
  return (
    <div className="flex justify-center mb-6 px-4">
      <div className="flex flex-col sm:flex-row gap-3 p-3 rounded-lg bg-card/50 backdrop-blur-sm border border-border/50 shadow-sm w-full max-w-xl">
        <Button
          variant={activeFilter === 'all' ? "default" : "ghost"}
          size="lg"
          onClick={() => handleFilterChange('all')}
          disabled={loading || activeFilter === 'all'}
          className="relative w-full min-w-[160px] group"
        >
          <ListFilter className="h-5 w-5 mr-2" />
          <span className="font-medium">
            {t("Show All", "显示所有")}
          </span>
        </Button>
        
        <Button
          variant={activeFilter === 'certified' ? "default" : "ghost"}
          size="lg"
          onClick={() => handleFilterChange('certified')}
          disabled={loading || activeFilter === 'certified'}
          className="relative w-full min-w-[160px] group"
        >
          <Filter className="h-5 w-5 mr-2" />
          <span className="font-medium">
            {t("Certified Only", "仅认证地点")}
          </span>
        </Button>
        
        <Button
          variant={activeFilter === 'calculated' ? "default" : "ghost"}
          size="lg"
          onClick={() => handleFilterChange('calculated')}
          disabled={loading || activeFilter === 'calculated'}
          className="relative w-full min-w-[160px] group"
        >
          <Filter className="h-5 w-5 mr-2" />
          <span className="font-medium">
            {t("Calculated Only", "仅计算位置")}
          </span>
        </Button>
      </div>
    </div>
  );
};

export default ViewToggle;
