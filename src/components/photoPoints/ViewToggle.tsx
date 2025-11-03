
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
  
  const handleViewChange = (view: PhotoPointsViewMode) => {
    if (view !== activeView) {
      console.log(`ViewToggle: Switching to ${view} view`);
      onViewChange(view);
    }
  };
  
  const viewTypes = [
    { value: 'certified' as const, label: t("Dark Sky Locations", "暗夜天空位置"), icon: BadgeCheck },
    { value: 'calculated' as const, label: t("Recommended Near Me", "附近推荐"), icon: MapPin },
    { value: 'obscura' as const, label: t("Natural Locations", "自然位置"), icon: Mountain },
    { value: 'mountains' as const, label: t("Obscura Locations", "奇观位置"), icon: Eye },
  ];
  
  const activeViewData = viewTypes.find(v => v.value === activeView);
  const ActiveIcon = activeViewData?.icon || Layers;

  return (
    <DropdownMenu>
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
      
      <DropdownMenuContent align="start" className="w-56 bg-background/95 backdrop-blur-sm">
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
  );
};

export default ViewToggle;
