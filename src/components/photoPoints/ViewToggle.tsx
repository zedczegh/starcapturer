
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

// Completely separate button component with minimal props and logic
const ToggleButton = ({ 
  active, 
  onClick, 
  disabled, 
  icon, 
  label, 
  color 
}: { 
  active: boolean; 
  onClick: () => void; 
  disabled: boolean; 
  icon: React.ReactNode; 
  label: string; 
  color: string;
}) => (
  <motion.div 
    className="flex-1 mx-4"
    initial={{ opacity: 0.9, scale: 0.98 }}
    animate={{ 
      opacity: 1, 
      scale: active ? 1.03 : 1,
      transition: { type: "spring", stiffness: 300, damping: 15 }
    }}
  >
    <Button
      variant={active ? "default" : "ghost"}
      size="sm"
      onClick={onClick}
      disabled={disabled}
      className={`relative w-full py-1.5 justify-center ${
        active
          ? `bg-gradient-to-r from-${color}-500/90 to-${color}-600/90 text-primary-foreground hover:from-${color}-500/100 hover:to-${color}-600/100`
          : 'text-muted-foreground hover:text-foreground hover:bg-background/90'
      }`}
    >
      {active && (
        <motion.div
          className="absolute inset-0 rounded-md pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ 
            opacity: [0.5, 0.8, 0.5],
            transition: { duration: 2, repeat: Infinity, ease: "easeInOut" }
          }}
          style={{ 
            boxShadow: `0 0 15px rgba(${color === 'amber' ? '251, 191, 36' : '139, 92, 246'}, 0.6), 
                        inset 0 0 8px rgba(${color === 'amber' ? '251, 191, 36' : '139, 92, 246'}, 0.4)`
          }}
        />
      )}
      <motion.div
        className="mr-2"
        animate={active ? {
          rotate: [0, 5, -5, 0],
          scale: [1, 1.2, 1],
          transition: { duration: 0.6, repeat: Infinity, repeatDelay: 3 }
        } : {}}
      >
        {icon}
      </motion.div>
      <span>{label}</span>
    </Button>
  </motion.div>
);

// Main component with completely separated button instances
const ViewToggle: React.FC<ViewToggleProps> = ({
  activeView,
  onViewChange,
  loading = false
}) => {
  const { t } = useLanguage();
  
  // Handlers are completely separate for each button
  const handleCertifiedClick = React.useCallback(() => {
    if (!loading && activeView !== 'certified') {
      console.log("ViewToggle: Changing to certified view");
      onViewChange('certified');
    }
  }, [activeView, onViewChange, loading]);
  
  const handleCalculatedClick = React.useCallback(() => {
    if (!loading && activeView !== 'calculated') {
      console.log("ViewToggle: Changing to calculated view");
      onViewChange('calculated');
    }
  }, [activeView, onViewChange, loading]);
  
  // Make sure we're consistently using the same hook calls regardless of state
  React.useEffect(() => {
    console.log("ViewToggle rendered with activeView:", activeView);
  }, [activeView]);
  
  return (
    <div className="flex justify-center mb-6">
      <motion.div 
        className="flex flex-col bg-muted/30 p-1.5 rounded-lg shadow-sm border border-border/50 w-full max-w-sm gap-2 relative overflow-hidden"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
        
        {/* Completely separate button components */}
        <ToggleButton
          active={activeView === 'certified'}
          onClick={handleCertifiedClick}
          disabled={loading || activeView === 'certified'}
          icon={<Sparkles className="h-4 w-4" />}
          label={t("Certified Dark Skies", "认证暗夜区")}
          color="amber"
        />
        
        <ToggleButton
          active={activeView === 'calculated'}
          onClick={handleCalculatedClick}
          disabled={loading || activeView === 'calculated'}
          icon={<MapPin className="h-4 w-4" />}
          label={t("Calculated Spots", "计算位置")}
          color="primary"
        />
      </motion.div>
    </div>
  );
};

export default ViewToggle;
