import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLocationCollection } from '@/hooks/useLocationCollection';
import { Button } from '@/components/ui/button';
import { Star } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import AuthDialog from '../auth/AuthDialog';

interface LocationDetailsHeaderProps {
  name: string;
  latitude: number;
  longitude: number;
  timestamp: string;
}

const LocationDetailsHeader = ({ 
  name, 
  latitude, 
  longitude,
  timestamp 
}: LocationDetailsHeaderProps) => {
  const { t } = useLanguage();
  const { saveLocation, isSaving } = useLocationCollection();
  const { user } = useAuth();
  const [showAuthDialog, setShowAuthDialog] = useState(false);

  const handleSaveLocation = () => {
    if (!user) {
      setShowAuthDialog(true);
      return;
    }
    saveLocation({
      name,
      latitude,
      longitude,
      timestamp
    });
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold mb-2">{name}</h1>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSaveLocation}
          disabled={isSaving}
          className="text-yellow-400 hover:text-yellow-500"
        >
          <Star className="h-5 w-5" fill="currentColor" />
        </Button>
      </div>
      <div className="text-sm text-muted-foreground">
        {latitude.toFixed(6)}, {longitude.toFixed(6)}
      </div>
      <AuthDialog 
        open={showAuthDialog} 
        onOpenChange={setShowAuthDialog} 
      />
    </div>
  );
};

export default LocationDetailsHeader;
