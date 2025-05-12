
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import AstroSpotProfile from '@/components/astro-spots/profile/SpotProfile';
import { clearSpotCache, makeSureProfileLoadsCorrectly } from '@/utils/cache/spotCacheCleaner';
import { motion, AnimatePresence } from 'framer-motion';

// This wrapper component ensures proper remounting of the profile
const AstroSpotProfilePage = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [mountKey, setMountKey] = useState<string>(`profile-${id}-${Date.now()}`);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const loadTimeRef = useRef<number>(Date.now());
  
  // Force a complete remount only when ID changes, not on every navigation state change
  useEffect(() => {
    // Ensure we have an ID parameter
    if (!id) {
      console.error("No AstroSpot ID provided in URL params");
      return;
    }
    
    // Record load time for performance tracking
    loadTimeRef.current = Date.now();
    
    // Skip cache clearing if noRefresh flag is set
    const skipCache = location.state?.noRefresh === true;
    
    // Clear any cached data for the spot on first mount
    if (!isInitialized) {
      if (!skipCache) {
        console.log("First mount, clearing spot cache for:", id);
        clearSpotCache(id);
        makeSureProfileLoadsCorrectly(id);
      } else {
        console.log("Skipping cache clear due to noRefresh flag");
      }
      setIsInitialized(true);
    }
    
    // Only generate a new mount key when the ID changes, not on every state update
    if (!location.state?.preserveMounting) {
      // Generate a unique mount key using ID and a stable timestamp
      // Use location.state?.timestamp if present, or current time if not
      const timestamp = location.state?.timestamp || Date.now();
      const newMountKey = `profile-${id}-${timestamp}`;
      console.log("Setting new mount key:", newMountKey);
      setMountKey(newMountKey);
      
      // Only add a timestamp in navigation state if there isn't one already
      if (!location.state?.timestamp) {
        const newTimestamp = Date.now();
        console.log("Adding timestamp to AstroSpot profile:", id, newTimestamp);
        
        // Replace current navigation state with timestamp to ensure fresh rendering
        navigate(`/astro-spot/${id}`, {
          state: { 
            ...(location.state || {}),
            timestamp: newTimestamp,
            preserveMounting: true
          },
          replace: true
        });
      }
    }
    
    // Short delay to ensure component is ready
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [id, navigate, location.state, isInitialized]);
  
  console.log("Rendering AstroSpot profile with key:", mountKey, "for ID:", id);
  
  return (
    <AnimatePresence mode="wait">
      <motion.div 
        key={mountKey}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }} // Keep transition time short for better UX
      >
        <AstroSpotProfile key={mountKey} />
      </motion.div>
    </AnimatePresence>
  );
};

export default AstroSpotProfilePage;
