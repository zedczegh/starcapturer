
import React from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import LocationCard from "@/components/LocationCard";

interface CommunityLocationCardProps {
  spot: SharedAstroSpot;
  index: number;
  onClick: (id: string) => void;
  onInView: (spotId: string) => void;
}

const CommunityLocationCard: React.FC<CommunityLocationCardProps> = ({
  spot,
  index,
  onClick,
  onInView
}) => {
  const { t } = useLanguage();
  
  // Extract price if available
  const price = spot.default_price || undefined;
  
  return (
    <motion.button
      key={spot.id}
      className="relative text-left group focus:outline-none rounded-xl transition duration-300 ease-in-out hover:shadow-xl border-2 border-transparent hover:border-primary/70"
      onClick={() => onClick(spot.id)}
      aria-label={spot.name}
      style={{ background: "none", padding: 0 }}
      onMouseEnter={() => onInView(spot.id)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1, ease: "easeOut" }}
    >
      <div className="w-full h-full">
        <div className="transform transition-all duration-300 hover:scale-[1.02] group-hover:shadow-lg rounded-xl">
          <LocationCard
            id={spot.id}
            name={spot.name}
            latitude={spot.latitude}
            longitude={spot.longitude}
            siqs={null}
            timestamp={spot.timestamp}
            isCertified={!!spot.certification || !!spot.isDarkSkyReserve}
            username={spot.username || t('Anonymous Stargazer', '匿名观星者')}
            hideSiqs={true}
            price={price}
          />
        </div>
        <div className="absolute inset-0 rounded-xl z-10 transition bg-black/0 group-hover:bg-primary/10" />
      </div>
    </motion.button>
  );
};

export default CommunityLocationCard;
