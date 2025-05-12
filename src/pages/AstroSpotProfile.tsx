
import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import AstroSpotProfile from '@/components/astro-spots/profile/SpotProfile';

// This wrapper component ensures proper remounting of the profile
const AstroSpotProfilePage = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [mountKey, setMountKey] = useState<string>(`profile-${id}-${Date.now()}`);
  
  // Force a complete remount when ID or state changes
  useEffect(() => {
    // Ensure we have an ID parameter
    if (!id) {
      console.error("No AstroSpot ID provided in URL params");
      return;
    }
    
    // Generate a unique mount key using ID and timestamp
    const newMountKey = `profile-${id}-${location.state?.timestamp || Date.now()}`;
    console.log("Setting new mount key:", newMountKey);
    setMountKey(newMountKey);
    
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
  
  console.log("Rendering AstroSpot profile with key:", mountKey, "for ID:", id);
  
  return <AstroSpotProfile key={mountKey} />;
};

export default AstroSpotProfilePage;
