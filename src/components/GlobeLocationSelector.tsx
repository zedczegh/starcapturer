
import React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { SIQSLocation } from "@/utils/locationStorage";

interface GlobeLocationSelectorProps {
  onLocationSelect: (location: SIQSLocation) => void;
  onClose: () => void;
}

const GlobeLocationSelector: React.FC<GlobeLocationSelectorProps> = ({
  onLocationSelect,
  onClose
}) => {
  const { t } = useLanguage();
  
  // This is a simplified version of the globe selector
  // In a real implementation, this would integrate with a 3D globe library
  const handleSelectLocation = (location: SIQSLocation) => {
    onLocationSelect(location);
  };

  return (
    <div className="bg-cosmic-900 rounded-lg shadow-lg overflow-hidden w-full max-w-4xl max-h-[80vh] flex flex-col">
      <div className="p-4 flex justify-between items-center border-b border-cosmic-700">
        <h2 className="text-xl font-semibold">
          {t("Select Location from Globe", "从地球选择位置")}
        </h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>
      
      <div className="p-6 overflow-auto">
        <div className="text-center text-muted-foreground mb-6">
          {t("Click anywhere on the globe to select a location", "点击地球上的任何位置以选择位置")}
        </div>
        
        <div className="h-[40vh] w-full bg-cosmic-800 rounded-lg flex items-center justify-center">
          <p className="text-muted-foreground">
            {t("Globe view placeholder - select from these example locations:", 
               "地球视图占位符 - 从这些示例位置中选择:")}
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-6">
          {exampleLocations.map((location, index) => (
            <Button 
              key={index} 
              variant="outline" 
              className="text-left h-auto py-3 justify-start"
              onClick={() => handleSelectLocation(location)}
            >
              <div>
                <div className="font-medium">{location.name}</div>
                <div className="text-sm text-muted-foreground">
                  {location.latitude.toFixed(4)}°, {location.longitude.toFixed(4)}°
                </div>
              </div>
            </Button>
          ))}
        </div>
      </div>
      
      <div className="p-4 border-t border-cosmic-700 flex justify-end">
        <Button variant="outline" onClick={onClose}>
          {t("Cancel", "取消")}
        </Button>
      </div>
    </div>
  );
};

// Example locations for the simplified globe selector
const exampleLocations: SIQSLocation[] = [
  { name: "Mauna Kea, Hawaii", latitude: 19.8236, longitude: -155.4717 },
  { name: "La Palma, Canary Islands", latitude: 28.7642, longitude: -17.8843 },
  { name: "Atacama Desert, Chile", latitude: -23.4501, longitude: -68.2247 },
  { name: "Kitt Peak, Arizona", latitude: 31.9583, longitude: -111.5967 },
  { name: "Namib Desert, Namibia", latitude: -24.7275, longitude: 15.2744 },
  { name: "Australian Outback", latitude: -25.3444, longitude: 131.0369 }
];

export default GlobeLocationSelector;
