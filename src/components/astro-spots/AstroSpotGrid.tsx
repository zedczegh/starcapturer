
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SharedAstroSpot } from '@/types/weather';
import LocationCard from '@/components/LocationCard';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import RealTimeSiqsProvider from '@/components/photoPoints/cards/RealTimeSiqsProvider';

interface AstroSpotGridProps {
  spots: SharedAstroSpot[];
  editMode: boolean;
  onDelete: (id: string) => Promise<void>;
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
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleSpotClick = (id: string) => {
    navigate(`/astro-spot/${id}`);
  };

  return (
    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {spots.map((spot) => (
        <div key={spot.id} className="relative">
          {editMode && (
            <Button
              variant="destructive"
              size="icon"
              className="absolute -top-3 -right-3 z-10 rounded-full w-8 h-8"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(spot.id);
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          <button
            className="w-full text-left block focus:outline-none"
            onClick={() => handleSpotClick(spot.id)}
          >
            <RealTimeSiqsProvider
              isVisible={true}
              latitude={spot.latitude}
              longitude={spot.longitude}
              bortleScale={spot.bortleScale || 4}
              existingSiqs={spot.siqs}
              onSiqsCalculated={(siqs, loading) => onSiqsCalculated(spot.id, siqs, loading)}
            />
            <LocationCard
              id={spot.id}
              name={spot.name}
              latitude={spot.latitude}
              longitude={spot.longitude}
              siqs={realTimeSiqs[spot.id] !== undefined ? realTimeSiqs[spot.id] : spot.siqs}
              timestamp={spot.timestamp}
              username={t("You", "您")}
            />
          </button>
        </div>
      ))}
    </div>
  );
};

export default AstroSpotGrid;
