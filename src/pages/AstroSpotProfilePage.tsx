
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import AstroSpotProfile from '@/components/astro-spots/profile/SpotProfile';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

// This wrapper component ensures proper remounting of the profile
const AstroSpotProfilePage = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [mountKey, setMountKey] = useState<string>(`profile-${id}-${Date.now()}`);
  const initialProcessingDone = useRef(false);
  const previousId = useRef<string | null>(null);
  const redirectAttemptsRef = useRef<number>(0);
  const navigationGuardRef = useRef<boolean>(false);
  
  // Force a complete remount when ID or state changes
  useEffect(() => {
    // Reset protection when component mounts
    navigationGuardRef.current = false;
    
    // Skip the entire process if we've already processed this exact ID to prevent unnecessary operations
    // This prevents loops and redundant refreshes
    if (initialProcessingDone.current && id === previousId.current) {
      console.log(`Skipping re-processing for already handled ID: ${id}`);
      return;
    }
    
    // Track that we're processing this ID
    initialProcessingDone.current = true;
    previousId.current = id || null;
    
    // Ensure we have an ID parameter
    if (!id) {
      console.error("No AstroSpot ID provided in URL params");
      toast.error("No AstroSpot ID provided");
      return;
    }
    
    // Generate a unique mount key to force remounting
    // Use any timestamp from state, or generate a new one
    const timestamp = location.state?.timestamp || Date.now();
    const newMountKey = `profile-${id}-${timestamp}`;
    console.log(`Setting profile mount key: ${newMountKey}`);
    setMountKey(newMountKey);
    
    // If there's no timestamp in state or we're detecting navigation issues, add one
    // This corrects the navigation state for proper remounting
    if (!location.state?.timestamp && redirectAttemptsRef.current < 2) {
      // Avoid navigation loops by tracking attempts
      redirectAttemptsRef.current += 1;

      // Don't redirect if we've tried more than once
      if (navigationGuardRef.current) {
        console.log("Navigation guard active, preventing redirect");
        return;
      }
      
      // Set guard to prevent multiple navigations
      navigationGuardRef.current = true;
      
      // Replace current navigation state with timestamp to ensure fresh rendering
      console.log(`Adding timestamp for clean profile rendering: ${id}, ${Date.now()}`);
      navigate(`/astro-spot/${id}`, {
        state: { 
          ...(location.state || {}),
          timestamp: Date.now(),
          profileMounted: true
        },
        replace: true
      });
    }
  }, [id, location.state, navigate]);
  
  // Reset when component unmounts
  useEffect(() => {
    return () => {
      initialProcessingDone.current = false;
      redirectAttemptsRef.current = 0;
      navigationGuardRef.current = false;
    };
  }, []);
  
  // Render the profile with a reliable key for remounting
  return (
    <AnimatePresence mode="wait">
      <motion.div 
        key={mountKey}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.1 }} // Super fast transition to reduce perceived flashing
      >
        <AstroSpotProfile key={mountKey} />
      </motion.div>
    </AnimatePresence>
  );
};

export default AstroSpotProfilePage;
