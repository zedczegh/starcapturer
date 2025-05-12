
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from "@/contexts/AuthContext";
import NavBar from "@/components/NavBar";
import ProfileContent from './ProfileContent';
import ProfileFooter from './ProfileFooter';
import BackButton from "@/components/navigation/BackButton";
import { clearSpotCache } from '@/utils/cache/spotCacheCleaner';

// Modified wrapper component to fix profile flashing issues
const AstroSpotProfile = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [comingFromCommunity, setComingFromCommunity] = useState(false);
  const [profileKey, setProfileKey] = useState<string>(`${id}-${Date.now()}`);
  const previousIdRef = useRef<string | null>(null);
  const mountTimeRef = useRef<number>(Date.now());
  const isInitialMount = useRef(true);
  
  // Generate consistent nav state to prevent unnecessary rerenders
  const backButtonState = useMemo(() => ({
    returnedFromSpot: true,
    refreshTimestamp: Date.now(),
    spotId: id || ''
  }), [id]);
  
  // Ensure proper component reset when ID or state changes
  useEffect(() => {
    if (!id) return; // Skip if no ID
    
    // Generate a stable key for this profile view
    const timestamp = location.state?.timestamp || Date.now();
    const newProfileKey = `${id}-${timestamp}`;
    
    console.log(`Profile opened for spot ID: ${id}, timestamp: ${timestamp}, prevId: ${previousIdRef.current}`);
    
    // Only update key if necessary to prevent flashing
    if (isInitialMount.current || id !== previousIdRef.current) {
      setProfileKey(newProfileKey);
      isInitialMount.current = false;
    }
    
    // Track where we came from for proper back button behavior
    if (location.state?.from === "community") {
      setComingFromCommunity(true);
    }
    
    // Clear spot-specific cache only once on mount, not on every render
    if (id !== previousIdRef.current) {
      clearSpotCache(id);
      previousIdRef.current = id;
      mountTimeRef.current = Date.now();
    }
    
    // If the ID has changed but we didn't get a new timestamp, force a reload
    if (id !== previousIdRef.current && !location.state?.forcedReset) {
      console.log("ID changed without proper navigation state, forcing refresh");
      const newTimestamp = Date.now();
      mountTimeRef.current = newTimestamp;
      
      // Force state update to ensure fresh data loading
      navigate(`/astro-spot/${id}`, { 
        state: { 
          ...(location.state || {}),
          timestamp: newTimestamp,
          forcedReset: true,
          profileMounted: true
        },
        replace: true
      });
    }
    
    // This cleanup runs when component unmounts or ID changes
    return () => {
      console.log("Profile component unmounting for ID:", id);
    };
  }, [id, location.state, navigate]);

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
          />
        </div>

        <ProfileContent 
          spotId={id} 
          user={!!user} 
          comingFromCommunity={comingFromCommunity}
          key={profileKey} // Key ensures re-render when profile changes
        />
      </div>
      
      <ProfileFooter />
    </div>
  );
};

export default AstroSpotProfile;
