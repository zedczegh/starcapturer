
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

export const useProfileActions = (spot: any) => {
  const navigate = useNavigate();

  const handleViewDetails = useCallback(() => {
    if (spot) {
      navigate(`/location/${spot.latitude},${spot.longitude}`, {
        state: {
          latitude: spot.latitude,
          longitude: spot.longitude,
          name: spot.name,
          bortleScale: spot.bortlescale,
          siqs: spot.siqs
        }
      });
    }
  }, [spot, navigate]);

  const handleMessageCreator = useCallback(() => {
    if (!spot?.user_id) return;
    navigate('/messages', { state: { selectedUser: spot.user_id } });
  }, [spot?.user_id, navigate]);

  return {
    handleViewDetails,
    handleMessageCreator
  };
};

export default useProfileActions;
