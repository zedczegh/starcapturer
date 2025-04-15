
import React, { useCallback, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { Sparkles, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

export type PhotoPointsViewMode = 'certified' | 'calculated';

interface ViewToggleProps {
  activeView: PhotoPointsViewMode;
  onViewChange: (view: PhotoPointsViewMode) => void;
  loading?: boolean;
}

// Separate button components to prevent shared state issues
const ViewToggleButton: React.FC<{
  isActive: boolean;
  onClick: () => void;
  disabled: boolean;
  icon: React.ReactNode;
  text: string;
  activeColor: string;
}> = ({ isActive, onClick, disabled, icon, text, activeColor }) => {
  // Define variants outside of the render function
  const buttonVariants = {
    active: { 
      scale: 1.03,
      transition: { 
        type: "spring", 
        stiffness: 300,
        damping: 15 
      }
    },
    inactive: { 
      scale: 1,
      transition: { 
        type: "spring", 
        stiffness: 300,
        damping: 15 
      }
    }
  };

  const iconVariants = {
    active: { 
      rotate: [0, 5, -5, 0],
      scale: [1, 1.2, 1],
      transition: { 
        duration: 0.6,
        repeat: Infinity,
        repeatDelay: 3
      }
    },
    inactive: {}
  };
  
  const glowVariants = {
    active: { 
      opacity: [0.5, 0.8, 0.5],
      transition: { 
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    },
    inactive: { 
      opacity: 0,
      transition: { duration: 0.3 }
    }
  };
  
  return (
    <motion.div
      variants={buttonVariants}
      initial="inactive"
      animate={isActive ? 'active' : 'inactive'}
      className="relative flex-1 mx-4"
    >
      <Button
        variant={isActive ? "default" : "ghost"}
        size="sm"
        onClick={onClick}
        disabled={disabled}
        className={`relative w-full py-1.5 justify-center ${
          isActive
            ? `bg-gradient-to-r from-${activeColor}-500/90 to-${activeColor}-600/90 text-primary-foreground hover:from-${activeColor}-500/100 hover:to-${activeColor}-600/100`
            : 'text-muted-foreground hover:text-foreground hover:bg-background/90'
        }`}
      >
        <motion.div
          className="absolute inset-0 rounded-md pointer-events-none"
          variants={glowVariants}
          initial="inactive"
          animate={isActive ? 'active' : 'inactive'}
          style={{ 
            boxShadow: `0 0 15px rgba(${isActive ? '251, 191, 36' : '139, 92, 246'}, 0.6), inset 0 0 8px rgba(${isActive ? '251, 191, 36' : '139, 92, 246'}, 0.4)`,
            opacity: 0
          }}
        />
        <motion.div
          className="mr-2"
          variants={iconVariants}
          initial="inactive"
          animate={isActive ? 'active' : 'inactive'}
        >
          {icon}
        </motion.div>
        <span>{text}</span>
      </Button>
    </motion.div>
  );
};

const ViewToggle: React.FC<ViewToggleProps> = ({
  activeView,
  onViewChange,
  loading = false
}) => {
  const { t } = useLanguage();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const switchTimeoutRef = useRef<number | null>(null);
  
  // Prevent rapid consecutive view changes that might cause race conditions
  const handleViewChange = useCallback((view: PhotoPointsViewMode) => {
    // Skip if already in the requested view or transition is in progress
    if (activeView === view || isTransitioning || loading) {
      return;
    }
    
    // Clear any existing timeout to prevent multiple transitions
    if (switchTimeoutRef.current) {
      window.clearTimeout(switchTimeoutRef.current);
      switchTimeoutRef.current = null;
    }
    
    // Set transitioning state to prevent multiple clicks
    setIsTransitioning(true);
    
    // Delay the actual view change
    console.log(`Starting transition to ${view} view`);
    switchTimeoutRef.current = window.setTimeout(() => {
      onViewChange(view);
      
      // Reset transition flag after another delay to give time for the view to update
      setTimeout(() => {
        setIsTransitioning(false);
        console.log(`Transition to ${view} view completed`);
      }, 800);
    }, 50);
    
  }, [activeView, onViewChange, loading, isTransitioning]);
  
  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (switchTimeoutRef.current) {
        window.clearTimeout(switchTimeoutRef.current);
      }
    };
  }, []);
  
  return (
    <div className="flex justify-center mb-6">
      <motion.div 
        className="flex flex-col bg-muted/30 p-1.5 rounded-lg shadow-sm border border-border/50 w-full max-w-sm gap-2 relative overflow-hidden"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Sci-fi decorative elements */}
        <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
        
        {/* Certified Button */}
        <ViewToggleButton
          isActive={activeView === 'certified'}
          onClick={() => handleViewChange('certified')}
          disabled={loading || isTransitioning || activeView === 'certified'}
          icon={<Sparkles className="h-4 w-4" />}
          text={t("Certified Dark Skies", "认证暗夜区")}
          activeColor="amber"
        />
        
        {/* Calculated Button */}
        <ViewToggleButton
          isActive={activeView === 'calculated'}
          onClick={() => handleViewChange('calculated')}
          disabled={loading || isTransitioning || activeView === 'calculated'}
          icon={<MapPin className="h-4 w-4" />}
          text={t("Calculated Spots", "计算位置")}
          activeColor="primary"
        />
      </motion.div>
    </div>
  );
};

export default ViewToggle;
