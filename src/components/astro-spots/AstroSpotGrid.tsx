
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from "framer-motion";
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import LocationCard from "@/components/LocationCard";
import MiniRemoveButton from "@/components/collections/MiniRemoveButton";
import RealTimeSiqsProvider from "@/components/photoPoints/cards/RealTimeSiqsProvider";
import { getSiqsScore } from '@/utils/siqsHelpers';

interface AstroSpotGridProps {
  spots: SharedAstroSpot[];
  editMode: boolean;
  onDelete: (spotId: string) => Promise<void>;
  onSiqsCalculated: (spotId: string, siqs: number | null, loading: boolean) => void;
  realTimeSiqs: Record<string, number | null>;
}

const AstroSpotGrid: React.FC<AstroSpotGridProps> = ({
  spots,
  editMode,
  onDelete,
  onSiqsCalculated,
  realTimeSiqs
}) => {
  const navigate = useNavigate();
  
  const handleSpotClick = (spotId: string) => {
    if (!editMode) {
      console.log("Navigating to astro spot profile:", spotId);
      navigate(`/astro-spot/${spotId}`);
    }
  };
  
  return (
    <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {spots.map((spot, index) => (
        <motion.div
          key={spot.id}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: index * 0.10 }}
          className="relative group"
          onClick={() => handleSpotClick(spot.id)}
        >
          {editMode && (
            <div className="absolute top-3 right-3 z-20">
              <MiniRemoveButton onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete(spot.id);
              }} />
            </div>
          )}
          <RealTimeSiqsProvider
            isVisible={true}
            latitude={spot.latitude}
            longitude={spot.longitude}
            bortleScale={spot.bortleScale}
            existingSiqs={spot.siqs}
            onSiqsCalculated={(siqs, loading) => onSiqsCalculated(spot.id, siqs, loading)}
          />
          <div className={`cursor-${editMode ? 'default' : 'pointer'} transition duration-200 hover:scale-[1.025]`}>
            <LocationCard
              id={spot.id}
              name={spot.name}
              latitude={spot.latitude}
              longitude={spot.longitude}
              siqs={realTimeSiqs[spot.id] !== undefined ? realTimeSiqs[spot.id] : getSiqsScore(spot.siqs)}
              timestamp={spot.timestamp}
              isCertified={false}
            />
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default AstroSpotGrid;
