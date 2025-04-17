import React, { useState, useEffect } from 'react';
import { MapPin, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSiqsNavigation } from '@/hooks/navigation/useSiqsNavigation';

const LocationPinButton: React.FC = () => {
  const { t } = useLanguage();
  const { getPosition } = useSiqsNavigation();
  const [locationFound, setLocationFound] = useState(false);
  
  useEffect(() => {
    const checkForExistingLocation = () => {
      try {
        const keys = Object.keys(localStorage);
        const locationKeys = keys.filter(key => key.startsWith('location_'));
        setLocationFound(locationKeys.length > 0);
      } catch (e) {
        console.error("Error checking localStorage:", e);
      }
    };

    checkForExistingLocation();
    window.addEventListener('storage', checkForExistingLocation);
    
    return () => {
      window.removeEventListener('storage', checkForExistingLocation);
    };
  }, []);
  
  const handleGetLocation = () => {
    getPosition();
    setLocationFound(true);
  };

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={handleGetLocation} 
      className="relative transition-all duration-300 hover:bg-primary/20"
      title={t("Update to your current location", "更新到您的当前位置")}
    >
      <MapPin className="h-5 w-5" />
      
      {locationFound && (
        <div className="absolute -top-1 -right-1 bg-green-500/35 rounded-full p-0.5 border-2 border-background shadow-sm">
          <Check className="h-2 w-2 text-white" strokeWidth={3} />
        </div>
      )}
    </Button>
  );
};

export default LocationPinButton;
