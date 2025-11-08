import React from 'react';
import { Card } from '@/components/ui/card';
import { MapPin, TrendingUp, Calendar, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
import { AggregatedLocation } from '@/hooks/admin/useSiqsAdminData';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

interface SiqsLocationCardProps {
  location: AggregatedLocation;
  index: number;
}

const SiqsLocationCard: React.FC<SiqsLocationCardProps> = ({ location, index }) => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const getSiqsColor = (score: number) => {
    if (score >= 8) return 'text-green-400 bg-green-500/10 border-green-500/20';
    if (score >= 6) return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
    if (score >= 4) return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
    return 'text-red-400 bg-red-500/10 border-red-500/20';
  };

  const handleClick = () => {
    if (location.source === 'photopoint' || location.source === 'search') {
      // Navigate to photo points map centered on this location
      navigate(`/photo-points?lat=${location.latitude}&lng=${location.longitude}`);
    } else if (location.source === 'community' && location.spot_id) {
      // Navigate to community spot profile
      navigate(`/astro-spot/${location.spot_id}`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card 
        className="bg-cosmic-800/40 border-cosmic-700/30 hover:bg-cosmic-800/60 hover:border-cosmic-600/50 transition-all cursor-pointer group"
        onClick={handleClick}
      >
        <div className="p-4 space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-cosmic-100 truncate group-hover:text-primary transition-colors">
                {location.location_name}
              </h3>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-cosmic-400">
                <MapPin className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">
                  {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                </span>
              </div>
            </div>
            
            {/* SIQS Score Badge */}
            <div className={`px-2.5 py-1 rounded-md border text-xs font-semibold flex-shrink-0 ${getSiqsColor(location.avg_siqs)}`}>
              {location.avg_siqs.toFixed(1)}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-cosmic-900/50 rounded-md p-2 border border-cosmic-700/20">
              <div className="flex items-center gap-1.5 text-cosmic-400 mb-1">
                <BarChart3 className="h-3 w-3" />
                <span className="text-xs">{t('Calculations', '计算次数')}</span>
              </div>
              <p className="text-sm font-semibold text-cosmic-100">
                {location.calculation_count}
              </p>
            </div>

            <div className="bg-cosmic-900/50 rounded-md p-2 border border-cosmic-700/20">
              <div className="flex items-center gap-1.5 text-cosmic-400 mb-1">
                <TrendingUp className="h-3 w-3" />
                <span className="text-xs">{t('Range', '范围')}</span>
              </div>
              <p className="text-xs font-medium text-cosmic-100">
                {location.min_siqs?.toFixed(1)} - {location.max_siqs?.toFixed(1)}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center gap-1.5 text-xs text-cosmic-400 pt-1 border-t border-cosmic-700/20">
            <Calendar className="h-3 w-3" />
            <span>
              {t('Last calculated', '最后计算')} {formatDistanceToNow(new Date(location.last_calculated_at), { addSuffix: true })}
            </span>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default SiqsLocationCard;
