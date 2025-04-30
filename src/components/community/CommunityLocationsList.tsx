
import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import LocationCard from "@/components/LocationCard";
import RealTimeSiqsProvider from "@/components/photoPoints/cards/RealTimeSiqsProvider";
import { useDebouncedCallback } from "@/hooks/useDebounce";
import { useLanguage } from "@/contexts/LanguageContext";
import CommunityLocationsSkeleton from "./CommunityLocationsSkeleton";
import { TooltipProvider } from "@/components/ui/tooltip";
import { toast } from "sonner";

interface CommunityLocationsListProps {
  locations: SharedAstroSpot[] | null;
  isLoading: boolean;
}

const CommunityLocationsList: React.FC<CommunityLocationsListProps> = ({ locations, isLoading }) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [realTimeSiqs, setRealTimeSiqs] = React.useState<Record<string, number | null>>({});
  const [loadingSiqs, setLoadingSiqs] = React.useState<Record<string, boolean>>({});
  const [attemptedSiqs, setAttemptedSiqs] = React.useState<Set<string>>(new Set());
  const [calculationQueue, setCalculationQueue] = React.useState<string[]>([]);
  const [processingErrors, setProcessingErrors] = React.useState<Record<string, string>>({});

  // Batch SIQS updates with priority queue
  React.useEffect(() => {
    if (!locations || locations.length === 0 || calculationQueue.length === 0) return;
    
    // Process queue with a delay to prevent overwhelming the system
    const timer = setTimeout(() => {
      const spotId = calculationQueue[0];
      setCalculationQueue(prev => prev.slice(1));
      
      // Mark this spot as being calculated
      setLoadingSiqs(prev => ({
        ...prev,
        [spotId]: true
      }));
    }, 250);
    
    return () => clearTimeout(timer);
  }, [calculationQueue, locations]);
  
  // Initialize visible spots for SIQS calculation
  React.useEffect(() => {
    if (!locations) return;
    
    console.log("Initializing calculations for locations:", locations.length);
    
    // Queue up initial calculations with a small delay
    // so they don't all start at once
    const initialSpots = locations.slice(0, 6).map(spot => spot.id);
    setCalculationQueue(initialSpots);
  }, [locations]);

  const debouncedSiqsUpdate = useDebouncedCallback((spotId: string, siqs: number | null, loading: boolean) => {
    console.log(`SIQS update for ${spotId}:`, { siqs, loading });
    
    setRealTimeSiqs(prev => ({
      ...prev,
      [spotId]: siqs
    }));
    setLoadingSiqs(prev => ({
      ...prev,
      [spotId]: loading
    }));
    
    if (!loading) {
      setAttemptedSiqs(prev => {
        const updated = new Set(prev);
        updated.add(spotId);
        return updated;
      });
    }
  }, 250);

  const handleCardClick = React.useCallback((id: string) => {
    navigate(`/astro-spot/${id}`, { 
      state: { from: 'community' } 
    });
  }, [navigate]);

  // Handle intersection observer for lazy loading SIQS data
  const handleCardInView = React.useCallback((spotId: string) => {
    if (!attemptedSiqs.has(spotId) && !calculationQueue.includes(spotId)) {
      setCalculationQueue(prev => [...prev, spotId]);
    }
  }, [attemptedSiqs, calculationQueue]);

  // Handle SIQS calculation errors
  const handleSiqsError = React.useCallback((spotId: string, error: string) => {
    setProcessingErrors(prev => ({
      ...prev,
      [spotId]: error
    }));
    
    // Mark as attempted to prevent retries
    setAttemptedSiqs(prev => {
      const updated = new Set(prev);
      updated.add(spotId);
      return updated;
    });
    
    // Clear loading state
    setLoadingSiqs(prev => ({
      ...prev,
      [spotId]: false
    }));
  }, []);

  // Utility function to get the SIQS score to display
  const getDisplaySiqs = React.useCallback((spot: SharedAstroSpot): number | null => {
    // First try to use real-time SIQS if available
    if (realTimeSiqs[spot.id] !== undefined) {
      return realTimeSiqs[spot.id];
    }
    
    // Fall back to stored SIQS from the database
    return spot.siqs !== undefined ? (
      typeof spot.siqs === 'number' ? spot.siqs : 
      typeof spot.siqs === 'object' && spot.siqs && 'score' in spot.siqs ? spot.siqs.score : null
    ) : null;
  }, [realTimeSiqs]);

  if (isLoading) {
    return <CommunityLocationsSkeleton />;
  }

  if (!locations || locations.length === 0) {
    return (
      <div className="w-full text-muted-foreground/70 text-center py-16">
        {t("No community astrospots yet. Be the first to share!", "还没有社区观星点，快来分享吧！")}
      </div>
    );
  }

  return (
    <TooltipProvider>
      <motion.div 
        className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {locations.map((spot: any, index: number) => (
          <motion.button
            key={spot.id}
            className="relative text-left group focus:outline-none rounded-xl transition duration-300 ease-in-out hover:shadow-xl border-2 border-transparent hover:border-primary/70"
            onClick={() => handleCardClick(spot.id)}
            aria-label={spot.name}
            style={{ background: "none", padding: 0 }}
            onMouseEnter={() => handleCardInView(spot.id)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1, ease: "easeOut" }}
          >
            <div className="w-full h-full">
              <RealTimeSiqsProvider
                key={`siqs-provider-${spot.id}`}
                isVisible={attemptedSiqs.has(spot.id) || calculationQueue.includes(spot.id)}
                latitude={spot.latitude}
                longitude={spot.longitude}
                bortleScale={spot.bortleScale || 4}
                existingSiqs={spot.siqs}
                onSiqsCalculated={(siqs, loading) =>
                  debouncedSiqsUpdate(spot.id, siqs, loading)
                }
                onError={(error) => handleSiqsError(spot.id, error)}
                forceUpdate={!attemptedSiqs.has(spot.id) && calculationQueue.includes(spot.id)}
              />
              <div className="transform transition-all duration-300 hover:scale-[1.02] group-hover:shadow-lg rounded-xl">
                <LocationCard
                  id={spot.id}
                  name={spot.name}
                  latitude={spot.latitude}
                  longitude={spot.longitude}
                  siqs={getDisplaySiqs(spot)}
                  timestamp={spot.timestamp}
                  isCertified={false}
                  username={spot.username}
                />
              </div>
              <div className="absolute inset-0 rounded-xl z-10 transition bg-black/0 group-hover:bg-primary/10" />
            </div>
          </motion.button>
        ))}
      </motion.div>
    </TooltipProvider>
  );
};

export default CommunityLocationsList;
