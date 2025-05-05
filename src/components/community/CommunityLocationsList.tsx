
import React from "react";
import { useNavigate } from "react-router-dom";
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import LocationCard from "@/components/LocationCard";
import RealTimeSiqsProvider from "@/components/photoPoints/cards/RealTimeSiqsProvider";
import { useDebounce } from "@/hooks/useDebounce";
import { useLanguage } from "@/contexts/LanguageContext";
import CommunityLocationsSkeleton from "./CommunityLocationsSkeleton";
import { TooltipProvider } from "@/components/ui/tooltip";

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
  const [visibleSpots, setVisibleSpots] = React.useState<number>(6); // Start with fewer spots
  const [calculationQueue, setCalculationQueue] = React.useState<string[]>([]);
  
  // Use refs to prevent unnecessary re-renders
  const locationsRef = React.useRef<SharedAstroSpot[] | null>(null);
  React.useEffect(() => {
    locationsRef.current = locations;
  }, [locations]);

  // Load more spots as the user scrolls
  const handleLoadMore = React.useCallback(() => {
    if (locationsRef.current && visibleSpots < locationsRef.current.length) {
      setVisibleSpots(prev => Math.min(prev + 6, locationsRef.current?.length || 0));
    }
  }, [visibleSpots]);

  // Set up intersection observer for infinite scrolling
  React.useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !isLoading) {
        handleLoadMore();
      }
    }, { threshold: 0.1 });
    
    const loadMoreTrigger = document.getElementById('load-more-trigger');
    if (loadMoreTrigger) {
      observer.observe(loadMoreTrigger);
    }
    
    return () => {
      if (loadMoreTrigger) {
        observer.unobserve(loadMoreTrigger);
      }
    };
  }, [handleLoadMore, isLoading]);

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
      
      // We don't need to do anything else here - the RealTimeSiqsProvider
      // for this spot will handle the calculation when it becomes visible
    }, 250);
    
    return () => clearTimeout(timer);
  }, [calculationQueue, locations]);
  
  // Initialize visible spots for SIQS calculation
  React.useEffect(() => {
    if (!locations) return;
    
    // Queue up initial calculations with a small delay
    // so they don't all start at once - only queue the first visible spots
    const initialSpots = locations.slice(0, visibleSpots).map(spot => spot.id);
    setCalculationQueue(prev => {
      // Filter out spots that are already in the queue
      const newSpots = initialSpots.filter(id => !prev.includes(id));
      return [...prev, ...newSpots];
    });
  }, [locations, visibleSpots]);

  const debouncedSiqsUpdate = useDebounce((spotId: string, siqs: number | null, loading: boolean) => {
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

  // Only render the visible number of spots
  const visibleLocations = locations.slice(0, visibleSpots);

  return (
    <TooltipProvider>
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
        {visibleLocations.map((spot: SharedAstroSpot) => (
          <button
            key={spot.id}
            className="relative text-left group focus:outline-none rounded-xl transition duration-150 ease-in-out hover:shadow-2xl hover:border-primary border-2 border-transparent"
            onClick={() => handleCardClick(spot.id)}
            aria-label={spot.name}
            style={{ background: "none", padding: 0 }}
            onMouseEnter={() => handleCardInView(spot.id)}
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
                forceUpdate={!attemptedSiqs.has(spot.id) && calculationQueue.includes(spot.id)}
              />
              <div className="transition-shadow group-hover:shadow-xl group-hover:ring-2 group-hover:ring-primary rounded-xl">
                <LocationCard
                  id={spot.id}
                  name={spot.name}
                  latitude={spot.latitude}
                  longitude={spot.longitude}
                  siqs={realTimeSiqs[spot.id] !== undefined ? realTimeSiqs[spot.id] : spot.siqs}
                  timestamp={spot.timestamp}
                  isCertified={false}
                  username={spot.username}
                />
              </div>
              <span className="absolute inset-0 rounded-xl z-10 transition bg-black/0 group-hover:bg-primary/5" />
            </div>
          </button>
        ))}
      </div>
      
      {/* Invisible element that triggers loading more spots when it comes into view */}
      {visibleSpots < (locations?.length || 0) && (
        <div id="load-more-trigger" className="h-10 w-full mt-4" />
      )}
    </TooltipProvider>
  );
};

export default React.memo(CommunityLocationsList);
