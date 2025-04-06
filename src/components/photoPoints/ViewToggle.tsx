
import React, { memo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

export type PhotoPointsViewMode = 'certified' | 'calculated';

interface ViewToggleProps {
  activeView: PhotoPointsViewMode;
  onViewChange: (view: PhotoPointsViewMode) => void;
  certifiedCount: number;
  calculatedCount: number;
  loading?: boolean;
}

const ViewToggle: React.FC<ViewToggleProps> = ({
  activeView,
  onViewChange,
  certifiedCount,
  calculatedCount,
  loading = false
}) => {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col items-center mb-6">
      <div className="bg-cosmic-900/60 border border-cosmic-700/30 p-1.5 rounded-xl shadow-lg flex items-center gap-6 max-w-xl mx-auto">
        <button
          onClick={() => onViewChange('certified')}
          className={`relative flex-1 flex items-center justify-center px-5 py-3 rounded-lg transition-all duration-300 ${
            activeView === 'certified'
              ? 'text-primary bg-cosmic-700/60 font-medium shadow-inner'
              : 'text-muted-foreground hover:bg-cosmic-800/60'
          }`}
          disabled={loading}
        >
          {activeView === 'certified' && (
            <motion.div
              layoutId="activeTab"
              className="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg"
              initial={false}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          )}
          <span className="relative z-10">{t("Dark Sky Parks", "暗夜公园")}</span>
          
          <Badge 
            variant="secondary" 
            className={`ml-2 ${activeView === 'certified' ? 'bg-primary/20 text-primary' : 'bg-cosmic-800'}`}
          >
            {loading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              certifiedCount
            )}
          </Badge>
        </button>
        
        <button
          onClick={() => onViewChange('calculated')}
          className={`relative flex-1 flex items-center justify-center px-5 py-3 rounded-lg transition-all duration-300 ${
            activeView === 'calculated'
              ? 'text-primary bg-cosmic-700/60 font-medium shadow-inner'
              : 'text-muted-foreground hover:bg-cosmic-800/60'
          }`}
          disabled={loading}
        >
          {activeView === 'calculated' && (
            <motion.div
              layoutId="activeTab"
              className="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg"
              initial={false}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          )}
          <span className="relative z-10">{t("Calculated", "计算点")}</span>
          
          <Badge 
            variant="secondary" 
            className={`ml-2 ${activeView === 'calculated' ? 'bg-primary/20 text-primary' : 'bg-cosmic-800'}`}
          >
            {loading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              calculatedCount
            )}
          </Badge>
        </button>
      </div>
    </div>
  );
};

export default memo(ViewToggle);
