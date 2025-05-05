
import React from 'react';
import { MapPin, Clock, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { LocationDetailsHeaderProps } from '@/types/location';

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
      className="bg-gradient-to-r from-cosmic-800/70 to-cosmic-800/40 backdrop-blur-sm rounded-lg border border-cosmic-700/30 p-5 mb-5 overflow-hidden relative shadow-glow-light"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Decorative elements for visual interest */}
      <div className="absolute -top-12 -right-12 w-24 h-24 bg-primary/10 rounded-full blur-xl"></div>
      <div className="absolute -bottom-8 -left-8 w-16 h-16 bg-indigo-500/10 rounded-full blur-lg"></div>
      
      <div className="relative z-10">
        <h1 className="text-2xl sm:text-3xl font-bold text-cosmic-50 mb-3 leading-tight">
          {name || t("Unnamed Location", "未命名位置")}
        </h1>
        
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
          <div className="flex items-center gap-2 text-cosmic-200 bg-cosmic-800/40 px-3 py-1.5 rounded-md border border-cosmic-700/30">
            <MapPin className="h-4 w-4 text-primary/80 flex-shrink-0" />
            <span className="text-sm">{formattedCoordinates}</span>
            <Button 
              size="icon"
              variant="ghost" 
              className="h-6 w-6 p-0.5 text-cosmic-300 hover:text-primary hover:bg-cosmic-700/30 ml-1"
              onClick={handleCopyCoordinates}
              title={t("Copy coordinates", "复制坐标")}
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
          </div>
          
          {timestamp && (
            <div className="flex items-center gap-2 text-cosmic-300 bg-cosmic-800/40 px-3 py-1.5 rounded-md border border-cosmic-700/30">
              <Clock className="h-4 w-4 text-cosmic-400 flex-shrink-0" />
              <span className="text-xs">{formattedTimestamp}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default LocationDetailsHeader;
