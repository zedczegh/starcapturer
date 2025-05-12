
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

export const useProfileActions = (spot: any) => {
  const navigate = useNavigate();

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
        from: 'astrospot-profile'
      },
      replace: false // Create a new history entry
    });
    
    console.log("Navigating to location details:", spot.latitude, spot.longitude, timestamp);
  }, [spot, navigate]);

  const handleMessageCreator = useCallback(() => {
    if (!spot?.user_id) {
      console.error("Cannot message creator: Missing user ID");
      return;
    }
    
    // Add timestamp to ensure UI refreshes properly
    navigate('/messages', { 
      state: { 
        selectedUserId: spot.user_id,
        timestamp: Date.now()
      },
      replace: false
    });
    
    console.log("Navigating to message creator:", spot.user_id);
  }, [spot?.user_id, navigate]);

  return {
    handleViewDetails,
    handleMessageCreator
  };
};

export default useProfileActions;
