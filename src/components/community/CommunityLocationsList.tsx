
import React from "react";
import { useNavigate } from "react-router-dom";
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import CommunityLocationsSkeleton from "./CommunityLocationsSkeleton";
import CommunityLocationsGrid from "./CommunityLocationsGrid";

interface CommunityLocationsListProps {
  locations: SharedAstroSpot[] | null;
  isLoading: boolean;
}

const CommunityLocationsList: React.FC<CommunityLocationsListProps> = ({ locations, isLoading }) => {
  const navigate = useNavigate();

  const handleCardClick = React.useCallback((id: string) => {
    navigate(`/astro-spot/${id}`, { 
      state: { from: 'community' } 
    });
  }, [navigate]);

  if (isLoading) {
    return <CommunityLocationsSkeleton />;
  }

  return <CommunityLocationsGrid locations={locations} onCardClick={handleCardClick} />;
};

export default CommunityLocationsList;
