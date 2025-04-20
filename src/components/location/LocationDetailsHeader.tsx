
import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLocationCollection } from '@/hooks/useLocationCollection';
import { Button } from '@/components/ui/button';
import { Star } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import AuthDialog from '../auth/AuthDialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
  const { saveLocation } = useLocationCollection();
  const { user } = useAuth();
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check if location is already saved by user
  useEffect(() => {
    const checkIfSaved = async () => {
      if (!user) {
        setIsSaved(false);
        return;
      }

      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('saved_locations')
          .select('id')
          .eq('user_id', user.id)
          .eq('latitude', latitude)
          .eq('longitude', longitude)
          .maybeSingle();

        if (error) throw error;
        setIsSaved(!!data);
      } catch (error) {
        console.error('Error checking saved status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkIfSaved();
  }, [user, latitude, longitude]);

  const handleToggleSave = async () => {
    if (!user) {
      setShowAuthDialog(true);
      return;
    }

    setIsLoading(true);
    try {
      if (isSaved) {
        // Remove from collection
        const { error } = await supabase
          .from('saved_locations')
          .delete()
          .eq('user_id', user.id)
          .eq('latitude', latitude)
          .eq('longitude', longitude);
          
        if (error) throw error;
        
        setIsSaved(false);
        toast.success(t("Removed from collection", "已从收藏中移除"));
      } else {
        // Add to collection
        await saveLocation({
          name,
          latitude,
          longitude,
          timestamp
        });
        setIsSaved(true);
      }
    } catch (error) {
      console.error('Error toggling save status:', error);
      toast.error(t("Action failed", "操作失败"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold mb-2">{name}</h1>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleToggleSave}
          disabled={isLoading}
          className={isSaved ? "text-yellow-400 hover:text-yellow-500" : "text-muted-foreground hover:text-yellow-400"}
        >
          <Star className="h-5 w-5" fill={isSaved ? "currentColor" : "none"} />
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
