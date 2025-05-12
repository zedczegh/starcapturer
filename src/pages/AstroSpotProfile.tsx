
import React, { useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import AstroSpotProfile from '@/components/astro-spots/profile/SpotProfile';

// This wrapper component ensures proper remounting of the profile
const AstroSpotProfilePage = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Force a complete remount when ID changes by using unique keys
  useEffect(() => {
    // Ensure we have an ID parameter
    if (!id) {
      console.error("No AstroSpot ID provided in URL params");
      return;
    }
    
    // If there's no timestamp in state, add one to force a proper mount
    if (!location.state?.timestamp) {
      const timestamp = Date.now();
      console.log("Adding timestamp to AstroSpot profile:", id, timestamp);
      
      // Replace current navigation state with timestamp to ensure fresh rendering
      navigate(`/astro-spot/${id}`, {
        state: { 
          ...(location.state || {}),
          timestamp,
          forcedReset: true
        },
        replace: true
      });
    }
  }, [id, location.state, navigate]);
  
  // Using the ID and timestamp as key ensures the component fully remounts
  // The key MUST change when either ID or timestamp changes
  const mountKey = `profile-${id}-${location.state?.timestamp || Date.now()}`;
  
  console.log("Rendering AstroSpot profile with key:", mountKey);
  
  return <AstroSpotProfile key={mountKey} />;
};

export default AstroSpotProfilePage;
