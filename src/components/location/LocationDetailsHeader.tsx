
import React from 'react';
import { MapPin, Clock, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

interface LocationDetailsHeaderProps {
  name: string;
  latitude: number;
  longitude: number;
  timestamp?: string;
}

const LocationDetailsHeader: React.FC<LocationDetailsHeaderProps> = ({
  name,
  latitude,
  longitude,
  timestamp
}) => {
  const { t, language } = useLanguage();
  
  // Format the coordinates for display
  const formattedCoordinates = `${latitude?.toFixed(4)}, ${longitude?.toFixed(4)}`;
  
  // Format the timestamp as "updated X minutes/hours ago"
  const formattedTimestamp = timestamp 
    ? formatDistanceToNow(new Date(timestamp), { addSuffix: true })
    : '';
  
  // Handle copying coordinates to clipboard
  const handleCopyCoordinates = () => {
    navigator.clipboard.writeText(`${latitude}, ${longitude}`);
    toast.success(t("Coordinates copied to clipboard", "坐标已复制到剪贴板"));
  };

  return (
    <motion.div 
      className="bg-cosmic-800/40 backdrop-blur-sm rounded-lg border border-cosmic-700/30 p-4 mb-6 overflow-hidden relative"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Decorative elements for visual interest */}
      <div className="absolute -top-12 -right-12 w-24 h-24 bg-primary/10 rounded-full blur-xl"></div>
      <div className="absolute -bottom-8 -left-8 w-16 h-16 bg-indigo-500/10 rounded-full blur-lg"></div>
      
      <div className="relative z-10">
        <h1 className="text-xl sm:text-2xl font-bold text-cosmic-50 mb-2 line-clamp-2">
          {name || t("Unnamed Location", "未命名位置")}
        </h1>
        
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm">
          <div className="flex items-center gap-1.5 text-cosmic-200">
            <MapPin className="h-3.5 w-3.5 text-primary/80" />
            <span className="flex-1">{formattedCoordinates}</span>
            <Button 
              size="icon"
              variant="ghost" 
              className="h-6 w-6 p-0.5 text-cosmic-300 hover:text-primary hover:bg-cosmic-700/30"
              onClick={handleCopyCoordinates}
              title={t("Copy coordinates", "复制坐标")}
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
          </div>
          
          {timestamp && (
            <div className="flex items-center gap-1.5 text-cosmic-300">
              <Clock className="h-3.5 w-3.5 text-cosmic-400" />
              <span className="text-xs">{formattedTimestamp}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default LocationDetailsHeader;
