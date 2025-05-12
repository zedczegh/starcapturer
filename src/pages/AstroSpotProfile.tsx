
import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import AstroSpotProfile from '@/components/astro-spots/profile/SpotProfile';
import { clearSpotCache, makeSureProfileLoadsCorrectly, detectProfileCacheLoop } from '@/utils/cache/spotCacheCleaner';
import { motion, AnimatePresence } from 'framer-motion';

// This wrapper component ensures proper remounting of the profile
const AstroSpotProfilePage = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [mountKey, setMountKey] = useState<string>(`profile-${id}-${Date.now()}`);
  const [isExiting, setIsExiting] = useState(false);
  
  // Force a complete remount when ID or state changes
  useEffect(() => {
    // Ensure we have an ID parameter
    if (!id) {
      console.error("No AstroSpot ID provided in URL params");
      return;
    }
    
    // Clear any cached data for the previous spot
    clearSpotCache(id);
    
    // Generate a unique mount key using ID and timestamp
    const newMountKey = `profile-${id}-${location.state?.timestamp || Date.now()}`;
    console.log("Setting new mount key:", newMountKey);
    setMountKey(newMountKey);
    
    // Make sure profile loads correctly by clearing spot-specific cache
    makeSureProfileLoadsCorrectly(id);
    
    // Check for potential cache loop issues
    const isCacheLoop = detectProfileCacheLoop(id);
    if (isCacheLoop) {
      console.warn("Cache loop detected, forcing a clean reload");
    }
    
    // If there's no timestamp in state, add one to force a proper mount
    if (!location.state?.timestamp || isCacheLoop) {
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
  
  return (
    <AnimatePresence mode="wait">
      <motion.div 
        key={mountKey}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <AstroSpotProfile key={mountKey} />
      </motion.div>
    </AnimatePresence>
  );
};

export default AstroSpotProfilePage;
