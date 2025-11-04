import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface CircularTab {
  value: string;
  label: string;
  icon: LucideIcon;
  count?: number;
}

interface CircularTabsProps {
  tabs: CircularTab[];
  activeTab: string;
  onTabChange: (value: string) => void;
  className?: string;
}

export const CircularTabs: React.FC<CircularTabsProps> = ({
  tabs,
  activeTab,
  onTabChange,
  className = ''
}) => {
  return (
    <div className={`flex gap-6 md:gap-8 justify-center flex-wrap ${className}`}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.value;
        
        return (
          <motion.button
            key={tab.value}
            onClick={() => onTabChange(tab.value)}
            className="relative flex flex-col items-center gap-2 group"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {/* Circular icon container */}
            <div
              className={`
                relative w-14 h-14 rounded-full flex items-center justify-center
                transition-all duration-300 border-2
                ${isActive 
                  ? 'bg-primary border-primary shadow-lg shadow-primary/30' 
                  : 'bg-cosmic-800/50 border-cosmic-700/50 hover:border-primary/50 hover:bg-cosmic-800/80'
                }
              `}
            >
              <Icon 
                className={`h-6 w-6 transition-colors ${
                  isActive ? 'text-primary-foreground' : 'text-cosmic-300 group-hover:text-primary'
                }`}
              />
              
              {/* Active indicator pulse */}
              {isActive && (
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-primary"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 0, 0.5],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              )}
            </div>
            
            {/* Label and count */}
            <div className="flex flex-col items-center">
              <span className={`text-xs font-medium transition-colors ${
                isActive ? 'text-primary' : 'text-cosmic-300 group-hover:text-cosmic-100'
              }`}>
                {tab.label}
              </span>
              {tab.count !== undefined && (
                <span className={`text-[10px] transition-colors ${
                  isActive ? 'text-primary/70' : 'text-cosmic-400'
                }`}>
                  ({tab.count})
                </span>
              )}
            </div>
          </motion.button>
        );
      })}
    </div>
  );
};
