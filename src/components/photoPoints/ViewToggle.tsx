
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { BadgeCheck, MapPin, Eye, Mountain, Layers } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type PhotoPointsViewMode = 'certified' | 'calculated' | 'obscura' | 'mountains';

interface ViewToggleProps {
  activeView: PhotoPointsViewMode;
  onViewChange: (view: PhotoPointsViewMode) => void;
  loading?: boolean;
  context?: 'photoPoints' | 'community';
}

const ViewToggle: React.FC<ViewToggleProps> = ({
  activeView,
  onViewChange,
  loading = false,
  context = 'photoPoints'
}) => {
  const { t } = useLanguage();
  
  const handleViewChange = (view: PhotoPointsViewMode) => {
    if (view !== activeView) {
      console.log(`ViewToggle (${context}): Switching to ${view} view`);
      onViewChange(view);
    }
  };
  
  // Context-specific view types
  const getViewTypes = () => {
    if (context === 'community') {
      return [
        { value: 'calculated' as const, label: t("All Spots", "全部地点"), icon: Layers },
        { value: 'certified' as const, label: t("Nightscape", "夜景"), icon: BadgeCheck },
        { value: 'mountains' as const, label: t("Natural", "自然"), icon: Mountain },
        { value: 'obscura' as const, label: t("Obscura", "奇观"), icon: Eye },
      ];
    }
    return [
      { value: 'certified' as const, label: t("Dark Sky Locations", "暗夜天空位置"), icon: BadgeCheck },
      { value: 'calculated' as const, label: t("Recommended Near Me", "附近推荐"), icon: MapPin },
      { value: 'obscura' as const, label: t("Obscura Locations", "奇观位置"), icon: Eye },
      { value: 'mountains' as const, label: t("Natural Locations", "自然位置"), icon: Mountain },
    ];
  };
  
  const viewTypes = getViewTypes();
  
  const activeViewData = viewTypes.find(v => v.value === activeView);
  const ActiveIcon = activeViewData?.icon || Layers;

  return (
    <TooltipProvider>
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild disabled={loading}>
              <motion.button
                className="relative flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-primary/15 to-accent/15 hover:from-primary/25 hover:to-accent/25 backdrop-blur-md border border-primary/40 shadow-md transition-all duration-300"
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
              >
                {/* Pulsing animation ring */}
                <motion.div
                  className="absolute inset-0 rounded-full bg-primary/15"
                  animate={{
                    scale: [1, 1.15, 1],
                    opacity: [0.4, 0, 0.4],
                  }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
                
                {/* Icon */}
                <ActiveIcon className="h-5 w-5 text-primary relative z-10" />
              </motion.button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="right" className="max-w-xs">
            <p className="text-xs">
              {t("Select map filter here", "在此选择地图过滤器")}
            </p>
          </TooltipContent>
        </Tooltip>
      
      <DropdownMenuContent align="start" className="w-56 bg-cosmic-900/95 backdrop-blur-md border-cosmic-700/50 z-[9999]">
        {viewTypes.map(({ value, label, icon: Icon }) => (
          <DropdownMenuItem
            key={value}
            onClick={() => handleViewChange(value)}
            disabled={activeView === value}
            className="cursor-pointer"
          >
            <Icon className="mr-2 h-4 w-4" />
            <span className={activeView === value ? "font-medium text-primary" : ""}>
              {label}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
      </DropdownMenu>
    </TooltipProvider>
  );
};

export default ViewToggle;
