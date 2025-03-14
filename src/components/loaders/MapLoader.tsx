
import React from 'react';
import { Loader, Map } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface MapLoaderProps {
  message?: string;
  showBorder?: boolean;
}

const MapLoader: React.FC<MapLoaderProps> = ({ 
  message,
  showBorder = true
}) => {
  const { t } = useLanguage();
  const defaultMessage = t("Loading map data...", "正在加载地图数据...");
  
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-cosmic-800/40 backdrop-blur-sm z-20 transition-all duration-300">
      <div className={`flex flex-col items-center p-5 rounded-xl bg-cosmic-900/90 ${showBorder ? 'border border-primary/20 shadow-lg shadow-primary/5' : ''}`}>
        <div className="relative">
          <Map className="h-10 w-10 text-cosmic-600/50" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader className="h-6 w-6 animate-spin text-primary" />
          </div>
        </div>
        <p className="mt-3 text-primary-foreground/90 text-sm font-medium tracking-wide">
          {message || defaultMessage}
        </p>
      </div>
    </div>
  );
};

export default MapLoader;
