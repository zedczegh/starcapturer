
import React from "react";
import { MapPin } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface MapMarkerProps {
  name: string;
  placeDetails?: string;
  onClick: () => void;
}

const MapMarker: React.FC<MapMarkerProps> = ({ name, placeDetails, onClick }) => {
  const { language } = useLanguage();
  
  // This callback prevents event propagation to avoid double-handling
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClick();
  };
  
  return (
    <li
      className="cursor-pointer hover:bg-primary/10 active:bg-primary/20 transition-colors px-4 py-3 rounded-md"
      onClick={handleClick}
      data-testid="map-marker"
    >
      <div className="flex items-start">
        <MapPin className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0 text-primary" />
        <div className="w-full">
          <div className={`font-medium ${language === 'zh' ? 'text-cosmic-200' : ''}`}>{name}</div>
          {placeDetails && (
            <div className={`text-xs text-muted-foreground break-words ${language === 'zh' ? 'mt-0.5' : ''}`}>
              {placeDetails}
            </div>
          )}
        </div>
      </div>
    </li>
  );
};

export default React.memo(MapMarker);
