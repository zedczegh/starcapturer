
import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { MapIcon, ChevronDown, ChevronUp } from 'lucide-react';

export interface MapLegendProps {
  onToggle: (isVisible: boolean) => void;
}

const MapLegend: React.FC<MapLegendProps> = ({ onToggle }) => {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    onToggle(newState);
  };

  return (
    <div className="absolute right-4 top-4 z-[1000]">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <Button
          variant="ghost"
          size="sm"
          className="w-full flex items-center justify-between p-2"
          onClick={handleToggle}
        >
          <span className="flex items-center gap-2">
            <MapIcon size={16} />
            {t("Map Legend", "地图图例")}
          </span>
          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </Button>

        {isOpen && (
          <div className="px-4 py-3 space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-green-500"></div>
              <span className="text-sm">{t("Excellent (SIQS 7-10)", "极佳 (SIQS 7-10)")}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
              <span className="text-sm">{t("Good (SIQS 5-7)", "良好 (SIQS 5-7)")}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-blue-500"></div>
              <span className="text-sm">{t("Dark Sky Reserve", "黑暗天空保护区")}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-purple-500"></div>
              <span className="text-sm">{t("Dark Sky Park", "黑暗天空公园")}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full border-2 border-red-500 bg-white"></div>
              <span className="text-sm">{t("Your location", "您的位置")}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapLegend;
