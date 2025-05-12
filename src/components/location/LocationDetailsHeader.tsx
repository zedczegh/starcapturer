
import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLocationCollection } from '@/hooks/useLocationCollection';
import { Button } from '@/components/ui/button';
import { Star, Share2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import AuthDialog from '../auth/AuthDialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLocationDetailsService } from './header/LocationDetailsService';

interface LocationDetailsHeaderProps {
  name: string;
  latitude?: number;
  longitude?: number;
  timestamp?: string;
}

const LocationDetailsHeader = ({ 
  name, 
  latitude, 
  longitude,
  timestamp 
}: LocationDetailsHeaderProps) => {
  const { t, language } = useLanguage();
  const { saveLocation } = useLocationCollection();
  const { user } = useAuth();
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Early return if no coordinates are provided
  const hasValidCoordinates = latitude !== undefined && longitude !== undefined;
  
  // Use the location details service to get enhanced location name
  const { enhancedName } = useLocationDetailsService({
    latitude: latitude || 0,
    longitude: longitude || 0,
    language
  });

  // Display the enhanced name if available, otherwise fall back to the provided name
  const displayName = enhancedName || name;

  // Check if location is already saved by user
  useEffect(() => {
    const checkIfSaved = async () => {
      if (!user || !hasValidCoordinates) {
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
  }, [user, latitude, longitude, hasValidCoordinates]);

  const handleToggleSave = async () => {
    if (!user) {
      setShowAuthDialog(true);
      return;
    }

    if (!hasValidCoordinates) {
      toast.error(t("Invalid location coordinates", "位置坐标无效"));
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
          name: displayName, // Use the enhanced name for saving
          latitude,
          longitude,
          timestamp: timestamp || new Date().toISOString()
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

  // Handle sharing the location
  const handleShare = () => {
    const locationUrl = window.location.href;
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText(locationUrl)
        .then(() => {
          toast.success(t("Link copied to clipboard!", "链接已复制到剪贴板！"));
        })
        .catch((err) => {
          console.error("Failed to copy: ", err);
          // Fallback for clipboard API failures
          fallbackCopyToClipboard(locationUrl);
        });
    } else {
      // Fallback for browsers that don't support clipboard API
      fallbackCopyToClipboard(locationUrl);
    }
  };
  
  // Fallback copy method
  const fallbackCopyToClipboard = (text: string) => {
    try {
      const tempInput = document.createElement("input");
      tempInput.style.position = "absolute";
      tempInput.style.left = "-9999px";
      tempInput.value = text;
      document.body.appendChild(tempInput);
      tempInput.select();
      document.execCommand("copy");
      document.body.removeChild(tempInput);
      toast.success(t("Link copied to clipboard!", "链接已复制到剪贴板！"));
    } catch (err) {
      console.error("Fallback copy failed:", err);
      toast.error(t("Could not copy link, please copy it manually", "无法复制链接，请手动复制"));
    }
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold mb-2">{displayName}</h1>
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleShare}
            className="text-muted-foreground hover:text-primary"
          >
            <Share2 className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggleSave}
            disabled={isLoading || !hasValidCoordinates}
            className={isSaved ? "text-yellow-400 hover:text-yellow-500" : "text-muted-foreground hover:text-yellow-400"}
          >
            <Star className="h-5 w-5" fill={isSaved ? "currentColor" : "none"} />
          </Button>
        </div>
      </div>
      {hasValidCoordinates && (
        <div className="text-sm text-muted-foreground">
          {latitude.toFixed(6)}, {longitude.toFixed(6)}
        </div>
      )}
      <AuthDialog 
        open={showAuthDialog} 
        onOpenChange={setShowAuthDialog} 
      />
    </div>
  );
};

export default LocationDetailsHeader;
