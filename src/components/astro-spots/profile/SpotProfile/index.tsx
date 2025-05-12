
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from "@/contexts/AuthContext";
import NavBar from "@/components/NavBar";
import ProfileContent from './ProfileContent';
import ProfileFooter from './ProfileFooter';
import BackButton from "@/components/navigation/BackButton";
import { clearSpotCache } from '@/utils/cache/spotCacheCleaner';

// Optimized wrapper component with improved rendering controls
const AstroSpotProfile = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [comingFromCommunity, setComingFromCommunity] = useState(false);
  const [profileKey, setProfileKey] = useState<string>(`${id}-${Date.now()}`);
  const previousIdRef = useRef<string | null>(null);
  const mountTimeRef = useRef<number>(Date.now());
  const noRefreshRef = useRef<boolean>(false);
  
  // Check if we should skip refreshing (e.g. coming from marker popup)
  const noRefresh = useMemo(() => {
    return location.state?.noRefresh === true;
  }, [location.state?.noRefresh]);
  
  // Ensure proper component reset when ID changes, but not on every state change
  useEffect(() => {
    // Update the noRefresh ref for use in cleanup
    noRefreshRef.current = noRefresh;
    
    // For markers/popups, we want to avoid unnecessary refreshing
    if (noRefresh) {
      console.log("Using no-refresh mode for profile:", id);
      return; // Skip the rest of the effect to avoid refreshing
    }
    
    // Generate a unique identifier for this specific profile view
    const timestamp = location.state?.timestamp || Date.now();
    const newProfileKey = `${id}-${timestamp}`;
    
    console.log(`Profile opened for spot ID: ${id}, timestamp: ${timestamp}, prevId: ${previousIdRef.current}`);
    setProfileKey(newProfileKey);
    
    // Track where we came from for proper back button behavior
    if (location.state?.from === "community") {
      setComingFromCommunity(true);
    }
    
    // Only clear cache when ID actually changes or we're not in noRefresh mode
    if (id !== previousIdRef.current && !noRefresh && id) {
      clearSpotCache(id);
    }
    
    // If the ID has changed but we didn't get a new timestamp, force a reload
    if (id !== previousIdRef.current && !location.state?.forcedReset && !noRefresh) {
      console.log("ID changed without proper navigation state, forcing refresh");
      const newTimestamp = Date.now();
      mountTimeRef.current = newTimestamp;
      
      // Force state update to ensure fresh data loading
      navigate(`/astro-spot/${id}`, { 
        state: { 
          ...(location.state || {}),
          timestamp: newTimestamp,
          forcedReset: true,
          // Preserve the noRefresh flag if it was set
          noRefresh: location.state?.noRefresh
        },
        replace: true
      });
    }
    
    previousIdRef.current = id || null;
  }, [id, location.state, navigate, noRefresh]);

  // If no ID is provided, show an error
  if (!id) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-cosmic-900 to-cosmic-950">
        <NavBar />
        <div className="container max-w-4xl py-8 px-4 md:px-6 relative">
          <div className="text-center py-12">
            <h1 className="text-2xl text-red-400 mb-4">Error: No AstroSpot ID provided</h1>
            <BackButton 
              destination="/community" 
              className="mx-auto"
            />
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-cosmic-900 to-cosmic-950">
      <NavBar />
      <div className="container max-w-4xl py-8 px-4 md:px-6 relative">
        <div className="flex justify-between items-start mb-6">
          <BackButton
            destination={comingFromCommunity ? "/community" : "/manage-astro-spots"}
            className="text-gray-300 hover:bg-cosmic-800/50"
            state={{ 
              returnedFromSpot: true,
              refreshTimestamp: Date.now(),
              spotId: id
            }}
          />
        </div>

        <ProfileContent 
          spotId={id} 
          user={!!user} 
          comingFromCommunity={comingFromCommunity}
          key={noRefresh ? id : profileKey} // Use stable key for noRefresh mode
        />
      </div>
      
      <ProfileFooter />
    </div>
  );
};

export default AstroSpotProfile;
