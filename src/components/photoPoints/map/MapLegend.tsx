
import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { Info, CalendarClock } from 'lucide-react';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface MapLegendProps {
  activeView: 'certified' | 'calculated';
  showStarLegend?: boolean;
  showCircleLegend?: boolean;
  onToggle?: (isOpen: boolean) => void;
  className?: string;
  isForecastMode?: boolean;
}

const MapLegend: React.FC<MapLegendProps> = ({
  activeView,
  showStarLegend = false,
  showCircleLegend = false,
  onToggle,
  className,
  isForecastMode = false
}) => {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  
  const toggleOpen = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    if (onToggle) {
      onToggle(newState);
    }
  };
  
  return (
    <div className={cn(
      "flex flex-col", 
      isOpen ? "bg-card/95 shadow-lg border border-border" : "", 
      "rounded-lg transition-all duration-200",
      className
    )}>
      <button 
        onClick={toggleOpen}
        className={cn(
          "flex items-center justify-center p-2 rounded-lg bg-primary text-primary-foreground",
          isOpen ? "rounded-b-none" : ""
        )}
        aria-label={t("Toggle map legend", "切换地图图例")}
      >
        {isForecastMode ? (
          <CalendarClock className="h-5 w-5" />
        ) : (
          <Info className="h-5 w-5" />
        )}
      </button>
      
      {isOpen && (
        <div className="p-3 space-y-4 w-56">
          <h3 className="font-medium text-sm">
            {isForecastMode
              ? t("Forecast Map Legend", "预测地图图例")
              : t("Map Legend", "地图图例")
            }
          </h3>
          
          {showStarLegend && (
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-muted-foreground">{t("Location Types", "位置类型")}</h4>
              <div className="space-y-1.5">
                <LegendItem 
                  label={t("Dark Sky Places", "黑暗天空保护区")} 
                  icon={<StarIcon size={6} color="gold" />} 
                />
                <LegendItem 
                  label={t("Certified Locations", "认证地点")} 
                  icon={<StarIcon size={5} color="#22c55e" />} 
                />
                <LegendItem 
                  label={t("Calculated Locations", "计算位置")} 
                  icon={<CircleIcon size={4} color="#6366f1" />} 
                />
              </div>
            </div>
          )}
          
          {showCircleLegend && (
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-muted-foreground">
                {isForecastMode 
                  ? t("Forecast Quality", "预测质量") 
                  : t("Sky Quality", "天空质量")
                }
              </h4>
              <div className="space-y-1.5">
                <LegendItem 
                  label={t("Excellent", "极佳")} 
                  icon={<CircleIcon size={4} color="#22c55e" />} 
                />
                <LegendItem 
                  label={t("Good", "良好")} 
                  icon={<CircleIcon size={4} color="#6366f1" />} 
                />
                <LegendItem 
                  label={t("Fair", "一般")} 
                  icon={<CircleIcon size={4} color="#eab308" />} 
                />
                <LegendItem 
                  label={t("Poor", "较差")} 
                  icon={<CircleIcon size={4} color="#ef4444" />} 
                />
              </div>
            </div>
          )}
          
          {isForecastMode && (
            <div className="text-xs text-muted-foreground pt-1 border-t border-border">
              {t("Forecast data based on predicted cloud cover and weather conditions", "预测数据基于预测的云量和天气状况")}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const LegendItem: React.FC<{ label: string, icon: React.ReactNode }> = ({ label, icon }) => {
  return (
    <div className="flex items-center space-x-2">
      {icon}
      <span className="text-xs">{label}</span>
    </div>
  );
};

const StarIcon: React.FC<{ size: number, color: string }> = ({ size, color }) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger>
        <svg viewBox="0 0 24 24" width={size * 2} height={size * 2} fill={color} stroke="none">
          <path d="M12 1.5l3 9h9l-7.5 5.5 2.5 9-7-5-7 5 2.5-9L2 10.5h9z" />
        </svg>
      </TooltipTrigger>
      <TooltipContent>
        <p className="text-xs">{color === 'gold' ? 'Dark Sky Reserve' : 'Certified Location'}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

const CircleIcon: React.FC<{ size: number, color: string }> = ({ size, color }) => (
  <div 
    style={{ 
      width: size * 2, 
      height: size * 2, 
      backgroundColor: color,
      borderRadius: '50%',
    }} 
  />
);

export default MapLegend;
