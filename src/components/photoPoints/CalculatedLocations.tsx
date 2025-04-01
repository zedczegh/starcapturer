
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw } from 'lucide-react';
import PhotoLocationCard from './PhotoLocationCard';
import { motion } from 'framer-motion';
import { SharedAstroSpot } from '@/lib/api/astroSpots';

interface CalculatedLocationsProps {
  locations: SharedAstroSpot[];
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onRefresh: () => void;
  searchRadius: number;
}

const CalculatedLocations: React.FC<CalculatedLocationsProps> = ({
  locations,
  loading,
  hasMore,
  onLoadMore,
  onRefresh,
  searchRadius
}) => {
  const { t } = useLanguage();

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.05,
        delayChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  // Loading state
  if (loading && (!locations || locations.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary" />
        <p>{t("Loading calculated locations...", "正在加载计算位置...")}</p>
      </div>
    );
  }

  // Empty state
  if (!loading && (!locations || locations.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center bg-cosmic-900/30 rounded-lg border border-cosmic-800/50">
        <div className="mb-4 p-4 rounded-full bg-cosmic-800/50">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-8 w-8 text-muted-foreground"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
            <path d="M8 11h8" />
            <path d="M12 15V7" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold mb-2">
          {t("No Calculated Locations Found", "未找到计算位置")}
        </h3>
        <p className="text-muted-foreground max-w-md mb-4">
          {t(
            "We couldn't find any algorithmically calculated locations within your search radius of",
            "在您的搜索半径内找不到任何算法计算的位置"
          )}{" "}
          {searchRadius}km.
        </p>
        <Button
          variant="outline"
          onClick={onRefresh}
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          {t("Refresh", "刷新")}
        </Button>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full"
    >
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        variants={containerVariants}
      >
        {locations.map((location, index) => (
          <motion.div
            key={`${location.id}-${index}`}
            variants={itemVariants}
            className="w-full"
          >
            <PhotoLocationCard
              key={location.id || `calculated-${index}`}
              location={location}
              index={index}
            />
          </motion.div>
        ))}
      </motion.div>

      {/* Load more button */}
      {hasMore && (
        <motion.div
          variants={itemVariants}
          className="w-full flex justify-center mt-6"
        >
          <Button
            variant="outline"
            onClick={onLoadMore}
            disabled={loading}
            className="min-w-[200px]"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                {t("Loading...", "加载中...")}
              </>
            ) : (
              t("Load More", "加载更多")
            )}
          </Button>
        </motion.div>
      )}

      {/* Refresh button */}
      <motion.div
        variants={itemVariants}
        className="w-full flex justify-center mt-4"
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={onRefresh}
          className="text-muted-foreground hover:text-primary"
        >
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
          {t("Refresh Data", "刷新数据")}
        </Button>
      </motion.div>
    </motion.div>
  );
};

export default CalculatedLocations;
