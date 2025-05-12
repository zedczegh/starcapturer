
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

export const useProfileActions = (spot: any) => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleViewDetails = useCallback(() => {
    if (!spot) {
      console.error("Cannot view details: No spot data provided");
      return;
    }

    if (!spot.latitude || !spot.longitude) {
      console.error("Cannot view details: Missing coordinates", spot);
      return;
    }

    // Generate a unique timestamp for each navigation
    const timestamp = Date.now();

    // Navigate to location details with a guaranteed fresh state
    navigate(`/location/${spot.latitude},${spot.longitude}`, {
      state: {
        latitude: spot.latitude,
        longitude: spot.longitude,
        name: spot.name,
        bortleScale: spot.bortlescale,
        siqs: spot.siqs,
        timestamp, // Add timestamp to force state refresh
        from: 'astro-spot-profile'
      },
      replace: false // Create a new history entry
    });
    
    console.log("Navigating to location details:", spot.latitude, spot.longitude, timestamp);
  }, [spot, navigate]);

  const handleMessageCreator = useCallback(() => {
    if (!spot?.user_id) {
      console.error("Cannot message creator: Missing user ID");
      toast.error(t("Could not message creator: Missing user information", "无法联系创建者：缺少用户信息"));
      return;
    }
    
    // Get the username if available
    const username = spot.username || "User";
    
    // Add timestamp to ensure UI refreshes properly and selectedUserId to select the right conversation
    navigate('/messages', { 
      state: { 
        selectedUserId: spot.user_id,
        selectedUsername: username,
        timestamp: Date.now()
      },
      replace: false
    });
    
    console.log("Navigating to message creator:", spot.user_id, username);
  }, [spot, navigate, t]);

  return {
    handleViewDetails,
    handleMessageCreator
  };
};

export default useProfileActions;
