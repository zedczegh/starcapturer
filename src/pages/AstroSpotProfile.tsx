
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import AstroSpotProfile from '@/components/astro-spots/profile/SpotProfile';
import { clearSpotCache, makeSureProfileLoadsCorrectly } from '@/utils/cache/spotCacheCleaner';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

// This wrapper component ensures proper remounting of the profile
const AstroSpotProfilePage = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [mountKey, setMountKey] = useState<string>(`profile-${id}-${Date.now()}`);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isError, setIsError] = useState(false);
  const loadTimeRef = useRef<number>(Date.now());
  const retryCountRef = useRef<number>(0);
  
  // Force a complete remount only when ID changes, not on every navigation state change
  useEffect(() => {
    // Ensure we have an ID parameter
    if (!id) {
      console.error("No AstroSpot ID provided in URL params");
      setIsError(true);
      return;
    }
    
    // Record load time for performance tracking
    loadTimeRef.current = Date.now();
    
    // Skip cache clearing if noRefresh flag is set
    const skipCache = location.state?.noRefresh === true;
    
    // Clear any cached data for the spot on first mount or if retrying after error
    if (!isInitialized || isError) {
      if (!skipCache) {
        console.log("First mount or retry, clearing spot cache for:", id);
        clearSpotCache(id);
        makeSureProfileLoadsCorrectly(id);
      } else {
        console.log("Skipping cache clear due to noRefresh flag");
      }
      setIsInitialized(true);
      setIsError(false);
    }
    
    // Only generate a new mount key when the ID changes, not on every state update
    if (!location.state?.preserveMounting || isError) {
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
    }, 200);
    
    return () => clearTimeout(timer);
  }, [id, navigate, location.state, isInitialized, isError]);
  
  // Add error boundary for production resilience
  useEffect(() => {
    // Set up error handling for production
    const handleError = (event: ErrorEvent) => {
      console.error("Caught runtime error:", event.error);
      
      // Only handle errors when this component is mounted
      if (!id || !isInitialized) return;
      
      // Prevent infinite retry loops
      if (retryCountRef.current > 2) {
        toast.error("Could not load this AstroSpot. Please try again later.");
        return;
      }
      
      // Set error state to trigger remount with fresh data
      setIsError(true);
      retryCountRef.current += 1;
      
      // Add slight delay before retry
      setTimeout(() => {
        clearSpotCache(id);
        setMountKey(`profile-${id}-${Date.now()}-retry-${retryCountRef.current}`);
      }, 500);
    };
    
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, [id, isInitialized]);
  
  console.log("Rendering AstroSpot profile with key:", mountKey, "for ID:", id);
  
  if (isError && retryCountRef.current > 2) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <h2 className="text-xl text-red-400 mb-2">Error Loading AstroSpot</h2>
        <p className="text-gray-400 mb-4">There was a problem loading this AstroSpot profile.</p>
        <button 
          className="px-4 py-2 bg-cosmic-800 hover:bg-cosmic-700 rounded-md"
          onClick={() => {
            retryCountRef.current = 0;
            setIsError(false);
            clearSpotCache(id);
            setMountKey(`profile-${id}-${Date.now()}-manual-retry`);
          }}
        >
          Try Again
        </button>
      </div>
    );
  }
  
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
