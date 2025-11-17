import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { ChevronDown, ChevronUp, MapPin, TrendingUp, BarChart3, Navigation } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CountyGroup } from '@/hooks/admin/useCountyGroupedSiqs';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';

interface CountyGroupCardProps {
  group: CountyGroup;
  index: number;
}

const CountyGroupCard: React.FC<CountyGroupCardProps> = ({ group, index }) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);

  const getSiqsColor = (score: number) => {
    if (score >= 8) return 'text-green-400 bg-green-500/10 border-green-500/20';
    if (score >= 6) return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
    if (score >= 4) return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
    return 'text-red-400 bg-red-500/10 border-red-500/20';
  };

  const handleLocationClick = (location: any) => {
    if (location.source === 'photopoint' || location.source === 'search') {
      navigate(`/photo-points?lat=${location.latitude}&lng=${location.longitude}`);
    } else if (location.source === 'community' && location.spot_id) {
      navigate(`/astro-spot/${location.spot_id}`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="bg-cosmic-800/40 border-cosmic-700/30 hover:bg-cosmic-800/60 transition-all overflow-hidden">
        {/* County Header - Clickable */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full p-4 text-left hover:bg-cosmic-700/20 transition-colors"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                <h3 className="text-base font-semibold text-cosmic-100">
                  {group.county}
                </h3>
              </div>
              
              {/* County Stats */}
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div className="bg-cosmic-900/50 rounded-md p-2 border border-cosmic-700/20">
                  <div className="flex items-center gap-1.5 text-cosmic-400 mb-1">
                    <TrendingUp className="h-3 w-3" />
                    <span className="text-xs">{t('Avg SIQS', '平均SIQS')}</span>
                  </div>
                  <p className="text-lg font-bold text-cosmic-100">
                    {group.avgSiqs.toFixed(1)}
                  </p>
                  <p className="text-xs text-cosmic-400 mt-0.5">
                    {t('Range', '范围')}: {group.minSiqs.toFixed(1)} - {group.maxSiqs.toFixed(1)}
                  </p>
                </div>

                <div className="bg-cosmic-900/50 rounded-md p-2 border border-cosmic-700/20">
                  <div className="flex items-center gap-1.5 text-cosmic-400 mb-1">
                    <BarChart3 className="h-3 w-3" />
                    <span className="text-xs">{t('Data Points', '数据点')}</span>
                  </div>
                  <p className="text-lg font-bold text-cosmic-100">
                    {group.totalCalculations}
                  </p>
                  <p className="text-xs text-cosmic-400 mt-0.5">
                    {t('Locations', '位置')}: {group.locations.length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col items-end gap-2">
              {/* County Average Badge */}
              <div className={`px-3 py-1.5 rounded-md border text-sm font-bold flex-shrink-0 ${getSiqsColor(group.avgSiqs)}`}>
                {group.avgSiqs.toFixed(1)}
              </div>
              
              {/* Expand/Collapse Icon */}
              <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="text-cosmic-400"
              >
                <ChevronDown className="h-5 w-5" />
              </motion.div>
            </div>
          </div>
        </button>

        {/* Expandable Location List */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="border-t border-cosmic-700/30"
            >
              <div className="p-4 space-y-2 bg-cosmic-900/30">
                <p className="text-xs font-medium text-cosmic-300 uppercase tracking-wider mb-3">
                  {t('Locations in this region', '该区域的位置')} ({group.locations.length})
                </p>
                
                {group.locations.map((location, idx) => (
                  <motion.div
                    key={`${location.latitude}-${location.longitude}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <button
                      onClick={() => handleLocationClick(location)}
                      className="w-full bg-cosmic-800/60 hover:bg-cosmic-800/80 rounded-lg p-3 border border-cosmic-700/20 hover:border-cosmic-600/40 transition-all text-left group"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-cosmic-100 truncate group-hover:text-primary transition-colors">
                            {location.location_name}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1 text-xs text-cosmic-400">
                            <Navigation className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">
                              {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-2 text-xs">
                            <span className="text-cosmic-400">
                              {t('Calculations', '计算')}: <span className="text-cosmic-100 font-medium">{location.calculation_count}</span>
                            </span>
                            <span className="text-cosmic-400">
                              {t('Range', '范围')}: <span className="text-cosmic-100 font-medium">
                                {location.min_siqs?.toFixed(1)} - {location.max_siqs?.toFixed(1)}
                              </span>
                            </span>
                          </div>
                        </div>
                        
                        <div className={`px-2.5 py-1 rounded-md border text-xs font-semibold flex-shrink-0 ${getSiqsColor(location.avg_siqs)}`}>
                          {location.avg_siqs.toFixed(1)}
                        </div>
                      </div>
                    </button>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
};

export default CountyGroupCard;
