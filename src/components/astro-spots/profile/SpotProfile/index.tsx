
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from "@/contexts/AuthContext";
import NavBar from "@/components/NavBar";
import ProfileContent from './ProfileContent';
import ProfileFooter from './ProfileFooter';
import BackButton from "@/components/navigation/BackButton";
import { clearSpotCache } from '@/utils/cache/spotCacheCleaner';
import { motion } from 'framer-motion';
import LocationDetailsLoading from '@/components/location/LocationDetailsLoading';

const AstroSpotProfile = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [comingFromCommunity, setComingFromCommunity] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [profileKey, setProfileKey] = useState<string>(`${id}-${Date.now()}`);
  const previousIdRef = useRef<string | null>(null);
  const mountTimeRef = useRef<number>(Date.now());
  const isInitialMount = useRef(true);
  const navigationTimestampRef = useRef<number | null>(null);
  
  // Improved component initialization
  useEffect(() => {
    // Track where we came from for proper back button behavior
    if (location.state?.from === "community") {
      setComingFromCommunity(true);
    }
    
    // Generate a stable identifier for this profile view
    const timestamp = location.state?.timestamp || Date.now();
    const newProfileKey = `${id}-${timestamp}`;
    setProfileKey(newProfileKey);
    
    // Store the navigation timestamp for reference
    navigationTimestampRef.current = timestamp;
    
    console.log(`Profile opened for spot ID: ${id}, timestamp: ${timestamp}`);
    
    // Only clear cache on first mount or when ID changes
    if (isInitialMount.current || id !== previousIdRef.current) {
      if (id) {
        // Skip clearing cache if noRefresh is set
        if (!location.state?.noRefresh) {
          clearSpotCache(id);
        } else {
          console.log("Skipping cache clear due to noRefresh flag");
        }
      }
      
      setIsLoading(true);
      
      // Add a short timeout before showing content to prevent flashing
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 200);
      
      return () => clearTimeout(timer);
    } else {
      setIsLoading(false);
    }
    
    previousIdRef.current = id || null;
    isInitialMount.current = false;
    
    // Clear any stale caches when component unmounts
    return () => {
      console.log("Profile component unmounting for ID:", id);
    };
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

        {isLoading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <LocationDetailsLoading />
          </motion.div>
        ) : (
          <motion.div 
            key={profileKey}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <ProfileContent 
              spotId={id} 
              user={!!user} 
              comingFromCommunity={comingFromCommunity}
              key={profileKey}
            />
          </motion.div>
        )}
      </div>
      
      <ProfileFooter />
    </div>
  );
};

export default AstroSpotProfile;
