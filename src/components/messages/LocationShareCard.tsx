
import React from 'react';
import { MapPin, Compass, Calendar } from 'lucide-react';
import { getProgressColorClass, getProgressTextColorClass } from '@/components/siqs/utils/progressColor';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { useLanguage } from '@/contexts/LanguageContext';

interface LocationShareCardProps {
  name: string;
  latitude: number;
  longitude: number;
  timestamp: string | number;
  siqs?: number;
  isMobile?: boolean;
}

const LocationShareCard: React.FC<LocationShareCardProps> = ({ 
  name, 
  latitude, 
  longitude, 
  timestamp, 
  siqs,
  isMobile = false
}) => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  
  const date = typeof timestamp === 'string' ? new Date(timestamp) : new Date(Number(timestamp));
  const formattedDate = format(date, 'MMM d, yyyy • HH:mm');
  
  const handleViewLocation = () => {
    navigate(`/nearby?lat=${latitude}&lng=${longitude}`);
  };
  
  // Function to determine siqs styling
  const getSiqsStyle = (siqsValue?: number) => {
    if (!siqsValue && siqsValue !== 0) {
      return { background: 'bg-cosmic-700/50', text: 'text-cosmic-200' };
    }
    
    return {
      background: getProgressColorClass(siqsValue),
      text: getProgressTextColorClass(siqsValue)
    };
  };
  
  const siqsStyle = getSiqsStyle(siqs);
  
  return (
    <div className="bg-cosmic-800/50 backdrop-blur-sm rounded-lg overflow-hidden border border-cosmic-700/30">
      <div className={`flex items-center gap-0.5 ${isMobile ? 'p-2' : 'p-3'}`}>
        <MapPin className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} text-primary mr-1`} />
        <div className="flex-1 min-w-0">
          <h4 className={`font-semibold ${isMobile ? 'text-sm' : 'text-base'} text-white truncate`}>
            {name || t('Shared Location', '分享的位置')}
          </h4>
          <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-cosmic-300 truncate`}>
            {latitude.toFixed(5)}, {longitude.toFixed(5)}
          </p>
        </div>
        
        {siqs !== undefined && (
          <div className={`flex items-center ${isMobile ? 'ml-1' : 'ml-2'}`}>
            <div className={`${isMobile ? 'w-7 h-7' : 'w-9 h-9'} rounded-full flex items-center justify-center ${siqsStyle.background}`}>
              <span className={`font-semibold ${isMobile ? 'text-xs' : 'text-sm'} text-white`}>
                {typeof siqs === 'number' ? siqs.toFixed(1) : '?'}
              </span>
            </div>
          </div>
        )}
      </div>
      
      <div className={`border-t border-cosmic-700/30 ${isMobile ? 'px-2 py-1.5' : 'px-3 py-2'} flex items-center justify-between text-xs text-cosmic-400`}>
        <div className="flex items-center">
          <Calendar className={`${isMobile ? 'h-3 w-3' : 'h-3.5 w-3.5'} mr-1`} />
          <span>{formattedDate}</span>
        </div>
        <Button
          variant="link"
          size="sm"
          onClick={handleViewLocation}
          className={`p-0 h-auto text-primary hover:text-primary/90 ${isMobile ? 'text-xs' : 'text-sm'}`}
        >
          <Compass className={`${isMobile ? 'h-3 w-3' : 'h-3.5 w-3.5'} mr-1`} />
          {t('View', '查看')}
        </Button>
      </div>
    </div>
  );
};

export default LocationShareCard;
