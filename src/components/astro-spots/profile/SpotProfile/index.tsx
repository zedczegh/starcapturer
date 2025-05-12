
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from "@/contexts/AuthContext";
import NavBar from "@/components/NavBar";
import ProfileContent from './ProfileContent';
import ProfileFooter from './ProfileFooter';
import BackButton from "@/components/navigation/BackButton";

// Modified wrapper component to force complete remount when the ID changes
const AstroSpotProfile = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [comingFromCommunity, setComingFromCommunity] = useState(false);
  const [profileKey, setProfileKey] = useState<string>(`${id}-${Date.now()}`);
  const previousIdRef = useRef<string | null>(null);
  const mountTimeRef = useRef<number>(Date.now());
  
  // Ensure proper component reset when ID or state changes
  useEffect(() => {
    // Generate a unique identifier for this specific profile view
    const timestamp = location.state?.timestamp || Date.now();
    const newProfileKey = `${id}-${timestamp}`;
    
    console.log(`Profile opened for spot ID: ${id}, timestamp: ${timestamp}, prevId: ${previousIdRef.current}`);
    setProfileKey(newProfileKey);
    
    // Track where we came from for proper back button behavior
    if (location.state?.from === "community") {
      setComingFromCommunity(true);
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
          forcedReset: true 
        },
        replace: true
      });
    }
    
    previousIdRef.current = id || null;
    
    // Clear any stale caches when component mounts/remounts
    return () => {
      // This cleanup ensures a fresh start when the component unmounts
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
