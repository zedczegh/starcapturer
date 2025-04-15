
import React from 'react';
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

const ViewToggle: React.FC<ViewToggleProps> = ({
  activeView,
  onViewChange,
  loading = false
}) => {
  const { t } = useLanguage();
  
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
        
        <motion.div
          variants={buttonVariants}
          initial="inactive"
          animate={activeView === 'certified' ? 'active' : 'inactive'}
          className="relative flex-1 mx-4"
        >
          <Button
            variant={activeView === 'certified' ? "default" : "ghost"}
            size="sm"
            onClick={() => onViewChange('certified')}
            className={`relative w-full py-1.5 justify-center ${
              activeView === 'certified'
                ? 'bg-gradient-to-r from-amber-500/90 to-amber-600/90 text-primary-foreground hover:from-amber-500/100 hover:to-amber-600/100'
                : 'text-muted-foreground hover:text-foreground hover:bg-background/90'
            }`}
          >
            <motion.div
              className="absolute inset-0 rounded-md pointer-events-none"
              variants={glowVariants}
              initial="inactive"
              animate={activeView === 'certified' ? 'active' : 'inactive'}
              style={{ 
                boxShadow: '0 0 15px rgba(251, 191, 36, 0.6), inset 0 0 8px rgba(251, 191, 36, 0.4)',
                opacity: 0
              }}
            />
            <motion.div
              className="mr-2"
              variants={iconVariants}
              initial="inactive"
              animate={activeView === 'certified' ? 'active' : 'inactive'}
            >
              <Sparkles className="h-4 w-4" />
            </motion.div>
            <span>
              {t("Certified Dark Skies", "认证暗夜区")}
            </span>
          </Button>
        </motion.div>
        
        <motion.div
          variants={buttonVariants}
          initial="inactive"
          animate={activeView === 'calculated' ? 'active' : 'inactive'}
          className="relative flex-1 mx-4"
        >
          <Button
            variant={activeView === 'calculated' ? "default" : "ghost"}
            size="sm"
            onClick={() => onViewChange('calculated')}
            className={`relative w-full py-1.5 justify-center ${
              activeView === 'calculated'
                ? 'bg-gradient-to-r from-primary/90 to-primary-dark/90 text-primary-foreground hover:from-primary hover:to-primary-dark'
                : 'text-muted-foreground hover:text-foreground hover:bg-background/90'
            }`}
          >
            <motion.div
              className="absolute inset-0 rounded-md pointer-events-none"
              variants={glowVariants}
              initial="inactive"
              animate={activeView === 'calculated' ? 'active' : 'inactive'}
              style={{ 
                boxShadow: '0 0 15px rgba(139, 92, 246, 0.6), inset 0 0 8px rgba(139, 92, 246, 0.4)',
                opacity: 0
              }}
            />
            <motion.div
              className="mr-2"
              variants={iconVariants}
              initial="inactive"
              animate={activeView === 'calculated' ? 'active' : 'inactive'}
            >
              <MapPin className="h-4 w-4" />
            </motion.div>
            <span>
              {t("Calculated Spots", "计算位置")}
            </span>
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default ViewToggle;
