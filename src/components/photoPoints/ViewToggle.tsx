
import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/contexts/LanguageContext';

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

  const handleValueChange = (value: string) => {
    onFilterChange(value as LocationListFilter);
    console.log(`ViewToggle: Switching to ${value} filter`);
  };

  return (
    <div className="flex justify-center mb-6">
      <Tabs 
        value={activeFilter} 
        onValueChange={handleValueChange}
        className="w-full max-w-md"
      >
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="all" disabled={loading}>
            {t("All", "全部")}
          </TabsTrigger>
          <TabsTrigger value="certified" disabled={loading}>
            {t("Certified", "认证")}
          </TabsTrigger>
          <TabsTrigger value="calculated" disabled={loading}>
            {t("Calculated", "计算")}
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
};

export default ViewToggle;
