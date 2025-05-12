
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from "@/contexts/AuthContext";
import NavBar from "@/components/NavBar";
import ProfileContent from './ProfileContent';
import ProfileFooter from './ProfileFooter';
import BackButton from "@/components/navigation/BackButton";

// Create this wrapper component to force complete remount when the ID changes
const AstroSpotProfile = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [comingFromCommunity, setComingFromCommunity] = useState(false);
  const previousIdRef = useRef<string | null>(null);
  const mountTimeRef = useRef<number>(Date.now());
  
  useEffect(() => {
    // Force profile content to update whenever ID or timestamp changes
    const timestamp = location.state?.timestamp || Date.now();
    console.log(`Profile opened for spot ID: ${id}, timestamp: ${timestamp}, prevId: ${previousIdRef.current}`);
    
    if (location.state?.from === "community") {
      setComingFromCommunity(true);
    }
    
    // If the ID has changed but we didn't get a new timestamp, force a reload
    if (id !== previousIdRef.current && !location.state?.forcedReset) {
      console.log("ID changed without proper navigation state, forcing refresh");
      mountTimeRef.current = Date.now();
    }
    
    previousIdRef.current = id || null;
  }, [id, location.state]);

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

  // Force component remount when critical props change by using a dedicated profile key
  const profileKey = `${id}-${location.state?.timestamp || mountTimeRef.current}`;
  
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
