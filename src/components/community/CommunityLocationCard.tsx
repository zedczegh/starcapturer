
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import LocationCard from "@/components/LocationCard";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { User } from "lucide-react";

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
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  
  // Fetch user avatar when spot changes
  useEffect(() => {
    const fetchUserAvatar = async () => {
      if (!spot.user_id) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', spot.user_id)
          .maybeSingle();
        
        if (data && data.avatar_url) {
          setAvatarUrl(data.avatar_url);
        }
      } catch (error) {
        console.error("Error fetching user avatar:", error);
      }
    };
    
    fetchUserAvatar();
  }, [spot.user_id]);
  
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
            siqs={spot.siqs}
            timestamp={spot.timestamp}
            isCertified={!!spot.certification || !!spot.isDarkSkyReserve}
            username={
              <div className="flex items-center gap-2">
                <Avatar className="h-5 w-5">
                  {avatarUrl ? (
                    <AvatarImage src={avatarUrl} alt={spot.username || t('Anonymous', '匿名')} />
                  ) : (
                    <AvatarFallback className="bg-primary/20 text-primary">
                      <User className="h-3 w-3" />
                    </AvatarFallback>
                  )}
                </Avatar>
                <span>{spot.username || t('Anonymous Stargazer', '匿名观星者')}</span>
              </div>
            }
            hideSiqs={true}
            price={spot.default_price}
            currency={spot.currency || '$'}
          />
        </div>
        <div className="absolute inset-0 rounded-xl z-10 transition bg-black/0 group-hover:bg-primary/10" />
      </div>
    </motion.button>
  );
};

export default CommunityLocationCard;
